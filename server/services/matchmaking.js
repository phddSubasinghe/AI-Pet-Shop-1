/**
 * Matchmaking: hard filters first, then OpenAI scoring. Cache by adopterId+petId+profileHash.
 */

import crypto from 'crypto';
import { Pet } from '../models/Pet.js';
import { MatchmakingResult } from '../models/MatchmakingResult.js';
import { IntegrationEvent } from '../models/IntegrationEvent.js';
import { getSettings, scoreMatch } from './openai.js';

/** Build a stable hash of adopter profile for cache key */
function profileHash(profile) {
  const str = JSON.stringify(profile);
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

/**
 * Hard filters: return { reject: true, reason } or { reject: false }.
 * - Adopter has cats and pet not cat-friendly -> reject
 * - Adopter home_type apartment and pet requires yard -> reject
 * - Adopter time_available low and pet high care -> reject
 * - Kids present and pet not good_with_kids -> reject
 */
function applyHardFilters(adopter, pet) {
  const hasCats = !!adopter.hasCats;
  const petCatFriendly = pet.species === 'cat' || pet.catFriendly === true;
  if (hasCats && !petCatFriendly) {
    return { reject: true, reason: 'Hard constraint mismatch: adopter has cats, pet is not cat-friendly' };
  }

  const adopterHome = adopter.livingSpace || adopter.home_type;
  const petRequiresYard = pet.livingSpace === 'house-with-yard';
  if (adopterHome === 'apartment' && petRequiresYard) {
    return { reject: true, reason: 'Hard constraint mismatch: apartment home but pet requires yard' };
  }

  const timeAvailable = (adopter.time_available || adopter.timeAvailable || '').toLowerCase();
  const petHighCare = pet.specialCare !== 'none' || pet.energyLevel === 'very-high' || pet.energyLevel === 'high';
  if ((timeAvailable === 'low' || timeAvailable === 'minimal') && petHighCare) {
    return { reject: true, reason: 'Hard constraint mismatch: low time availability vs high-care pet' };
  }

  const kidsPresent = adopter.kids && adopter.kids !== 'none';
  const petGoodWithKids = pet.kids && pet.kids !== 'none';
  if (kidsPresent && !petGoodWithKids) {
    return { reject: true, reason: 'Hard constraint mismatch: kids at home but pet not suitable with kids' };
  }

  return { reject: false };
}

/** Normalize adopter and pet to a small JSON for OpenAI */
function buildPayload(adopter, pet) {
  const adopterPayload = {
    livingSpace: adopter.livingSpace || adopter.home_type,
    energyLevel: adopter.energyLevel,
    experience: adopter.experience,
    kids: adopter.kids,
    specialCare: adopter.specialCare,
    hasCats: adopter.hasCats,
    timeAvailable: adopter.time_available || adopter.timeAvailable,
    preferredSpecies: adopter.preferredSpecies,
    preferredSize: adopter.preferredSize,
  };
  if (adopter.additionalInterests && String(adopter.additionalInterests).trim()) {
    adopterPayload.additionalInterests = String(adopter.additionalInterests).trim().slice(0, 500);
  }
  return {
    adopter: adopterPayload,
    pet: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      livingSpace: pet.livingSpace,
      energyLevel: pet.energyLevel,
      experience: pet.experience,
      kids: pet.kids,
      specialCare: pet.specialCare,
      size: pet.size,
      description: (pet.description || '').slice(0, 300),
    },
  };
}

/**
 * Get ranked recommendations for an adopter profile. Returns array of { petId, pet, score, label, reasons, risks, missing_info, version }.
 */
export async function getRecommendations(adopterProfile, adopterId = null) {
  const hash = profileHash(adopterProfile);
  const pets = await Pet.find({
    archived: { $ne: true },
    status: 'available',
    adoptionStatus: 'Available',
  }).lean();

  const results = [];
  const openaiSettings = await getSettings();

  for (const pet of pets) {
    const petId = pet._id.toString();
    const hard = applyHardFilters(adopterProfile, pet);
    if (hard.reject) {
      results.push({
        petId,
        pet: petSummary(pet),
        score: 0,
        label: 'NOT_SUITABLE',
        reasons: [hard.reason],
        risks: [],
        missing_info: [],
        version: '1.0',
      });
      continue;
    }

    const cached = adopterId
      ? await MatchmakingResult.findOne({ adopterId, petId, profileHash: hash }).lean()
      : null;
    if (cached) {
      results.push({
        petId,
        pet: petSummary(pet),
        score: cached.score,
        label: cached.label,
        reasons: cached.reasons || [],
        risks: cached.risks || [],
        missing_info: cached.missingInfo || [],
        version: cached.version || '1.0',
      });
      continue;
    }

    if (!openaiSettings) {
      results.push({
        petId,
        pet: petSummary(pet),
        score: 50,
        label: 'CONDITIONAL',
        reasons: ['OpenAI not configured; manual review recommended'],
        risks: [],
        missing_info: [],
        version: '1.0',
      });
      continue;
    }

    const payload = buildPayload(adopterProfile, pet);
    const scored = await scoreMatch(payload.adopter, payload.pet);
    if (!scored) {
      results.push({
        petId,
        pet: petSummary(pet),
        score: 50,
        label: 'CONDITIONAL',
        reasons: ['Scoring unavailable; manual review recommended'],
        risks: [],
        missing_info: [],
        version: '1.0',
      });
      continue;
    }

    if (adopterId) {
      await MatchmakingResult.create({
        adopterId,
        petId,
        profileHash: hash,
        score: scored.score,
        label: scored.label,
        reasons: scored.reasons,
        risks: scored.risks,
        missingInfo: scored.missing_info,
        version: scored.version,
      });
    }

    results.push({
      petId,
      pet: petSummary(pet),
      score: scored.score,
      label: scored.label,
      reasons: scored.reasons,
      risks: scored.risks,
      missing_info: scored.missing_info,
      version: scored.version,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/** Build pet summary for API response (id, name, species, breed, image, age). */
function petSummary(pet) {
  return {
    id: pet._id.toString(),
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    image: pet.image || (pet.photos && pet.photos[0]) || null,
    age: pet.age != null ? pet.age : null,
  };
}

import express from 'express';
import { Pet } from '../models/Pet.js';
import { User } from '../models/User.js';
import { AdoptionRequest } from '../models/AdoptionRequest.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

function toPublicPet(p, shelter) {
  const ageNum = Number(p.age) ?? 0;
  const ageStr = ageNum < 1 ? `${Math.round(ageNum * 12)} months` : `${ageNum} year${ageNum !== 1 ? 's' : ''}`;
  const images = [p.image, ...(p.photos || [])].filter(Boolean);
  const adoptionStatusLower = (p.adoptionStatus || p.status || 'available').toLowerCase();
  const adoptionStatus = adoptionStatusLower === 'reserved' ? 'reserved' : adoptionStatusLower === 'adopted' ? 'adopted' : 'available';
  return {
    id: p._id.toString(),
    name: p.name,
    species: p.species.charAt(0).toUpperCase() + p.species.slice(1),
    breed: p.breed || null,
    age: ageStr,
    gender: p.gender || 'unknown',
    energyLevel: p.energyLevel || null,
    weight: p.weight != null ? Number(p.weight) : null,
    height: p.height != null ? Number(p.height) : null,
    shelterId: p.shelterId,
    shelterName: shelter.shelterName,
    shelterEmail: shelter.shelterEmail,
    shelterAddress: shelter.shelterAddress,
    shelterPhone: shelter.shelterPhone,
    adoptionStatus,
    images,
    listedAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
  };
}

function toPublicPetDetail(p, shelter, authUser, hasApplied = false) {
  const base = toPublicPet(p, shelter);
  const likedIds = authUser?.likedPetIds ?? [];
  const wishlistIds = authUser?.wishlistPetIds ?? [];
  const petIdStr = p._id.toString();
  return {
    ...base,
    shelterLogoUrl: shelter.shelterLogoUrl ?? null,
    gender: p.gender || 'unknown',
    temperament: p.temperament || null,
    vaccinationStatus: p.vaccinationStatus || 'unknown',
    medicalNotes: p.medicalNotes || null,
    specialCareNeeds: p.specialCareNeeds || null,
    livingSpace: p.livingSpace || null,
    energyLevel: p.energyLevel || null,
    experience: p.experience || null,
    kids: p.kids || null,
    specialCare: p.specialCare || null,
    size: p.size || 'medium',
    weight: p.weight != null ? Number(p.weight) : null,
    height: p.height != null ? Number(p.height) : null,
    description: p.description || null,
    badges: Array.isArray(p.badges) ? p.badges : [],
    vaccinated: p.vaccinationStatus === 'up-to-date' || p.vaccinationStatus === 'partial',
    status: p.status || 'available',
    createdAt: p.createdAt?.toISOString?.() ?? new Date(p.createdAt).toISOString(),
    updatedAt: p.updatedAt?.toISOString?.() ?? new Date(p.updatedAt).toISOString(),
    isLiked: likedIds.includes(petIdStr),
    isInWishlist: wishlistIds.includes(petIdStr),
    hasApplied: !!hasApplied,
  };
}

/** GET /api/pets – list available pets for public browse (no auth). Returns only non-archived, available pets. */
router.get('/', async (req, res) => {
  try {
    const query = { archived: { $ne: true } };
    const statusFilter = req.query.status; // optional: available | reserved | adopted
    if (statusFilter && ['available', 'reserved', 'adopted'].includes(statusFilter)) {
      query.$or = [
        { adoptionStatus: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) },
        { status: statusFilter },
      ];
    } else {
      // default: only list available for adoption
      query.$or = [
        { adoptionStatus: 'Available' },
        { status: 'available' },
      ];
    }

    const pets = await Pet.find(query).sort({ updatedAt: -1 }).lean();
    const petIds = pets.map((p) => p._id.toString());
    const shelterIds = [...new Set(pets.map((p) => p.shelterId))];

    const [users, requestCounts] = await Promise.all([
      User.find({ _id: { $in: shelterIds }, role: 'shelter' })
        .select('name email organizationName address contactNumberShelter')
        .lean(),
      AdoptionRequest.aggregate([
        { $match: { petId: { $in: petIds } } },
        { $group: { _id: '$petId', count: { $sum: 1 } } },
      ]),
    ]);

    const shelterById = Object.fromEntries(
      users.map((u) => [
        u._id.toString(),
        {
          shelterName: u.organizationName || u.name || '—',
          shelterEmail: u.email || null,
          shelterAddress: u.address || null,
          shelterPhone: u.contactNumberShelter || null,
        },
      ])
    );
    const requestCountByPetId = Object.fromEntries(
      requestCounts.map((r) => [r._id, r.count])
    );

    const list = pets.map((p) => {
      const shelter = shelterById[p.shelterId] || { shelterName: '—', shelterEmail: null, shelterAddress: null, shelterPhone: null };
      const petIdStr = p._id.toString();
      return {
        ...toPublicPet(p, shelter),
        requestCount: requestCountByPetId[petIdStr] ?? 0,
      };
    });

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/pets/:id – get one pet by id with full details (public). Optional auth adds isLiked, isInWishlist, hasApplied. */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findOne({ _id: id, archived: { $ne: true } }).lean();
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    const users = await User.find({ _id: pet.shelterId, role: 'shelter' })
      .select('name email organizationName address contactNumberShelter logoUrl')
      .lean();
    const u = users[0];
    const shelter = u
      ? {
          shelterName: u.organizationName || u.name || '—',
          shelterEmail: u.email || null,
          shelterAddress: u.address || null,
          shelterPhone: u.contactNumberShelter || null,
          shelterLogoUrl: u.logoUrl || null,
        }
      : { shelterName: '—', shelterEmail: null, shelterAddress: null, shelterPhone: null, shelterLogoUrl: null };

    const authUser = req.authUser ? await User.findById(req.userId).select('likedPetIds wishlistPetIds').lean() : null;
    let hasApplied = false;
    if (req.userId && req.authUser?.role === 'adopter') {
      const existing = await AdoptionRequest.findOne({
        adopterId: String(req.userId),
        petId: String(id),
        status: { $nin: ['Rejected'] },
      }).lean();
      hasApplied = !!existing;
    }
    return res.json(toPublicPetDetail(pet, shelter, authUser, hasApplied));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

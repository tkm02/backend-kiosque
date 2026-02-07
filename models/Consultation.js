const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
    // Identifiants
    consultationId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true }, // Format PAT_anon_...

    // Patient
    ageYears: { type: Number, min: 0 },
    ageMonths: { type: Number, min: 0 },
    gender: { type: String, enum: ['M', 'F'] },
    region: String,
    district: String,
    commune: String,
    gpsLatitude: Number,
    gpsLongitude: Number,

    // Symptômes (Booleans)
    fievre: { type: Boolean, default: false },
    cephalees: { type: Boolean, default: false },
    nauseesVomissements: { type: Boolean, default: false },
    fatigue: { type: Boolean, default: false },
    douleursArticulaires: { type: Boolean, default: false },
    frissons: { type: Boolean, default: false },
    diarhee: { type: Boolean, default: false },
    troublesConscience: { type: Boolean, default: false },

    // Signes Vitaux
    temperatureC: Number,
    fcBpm: Number,
    frPm: Number,
    paSystolique: Number,
    paDiastolique: Number,
    spo2Pct: Number,

    // Laboratoire
    tdrPaludisme: { 
        type: String, 
        enum: ['positif', 'négatif', 'inconcluant', null],
        default: null
    },
    resultat_palu: { type: Boolean, default: false },
    parasitemiaPct: Number,
    especePaludisme: String,
    hemoglobineGDl: Number,

    // Gestion
    sourceType: { 
        type: String, 
        enum: ['kiosque', 'batch', 'api', 'mobile', 'pdf'],
        default: 'kiosque'
    },
    robotId: String,
    dataQualityStatus: { 
        type: String, 
        enum: ['valide', 'en revue', 'rejeté'],
        default: 'valide'
    }
}, {
    timestamps: true // Gère createdAt et updatedAt
});

// Indexation pour les recherches rapides
ConsultationSchema.index({ consultationId: 1 });
ConsultationSchema.index({ patientId: 1 });
ConsultationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ConsultationPaludismeCI', ConsultationSchema);

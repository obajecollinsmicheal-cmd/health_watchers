import { Schema, model, models } from 'mongoose';

export interface Clinic {
  name: string;
  address: string;
  contactEmail: string;
  stellarPublicKey: string;
  isActive: boolean;
  plan: 'basic' | 'standard' | 'enterprise';
}

const clinicSchema = new Schema<Clinic>(
  {
    name:             { type: String, required: true, trim: true },
    address:          { type: String, required: true, trim: true },
    contactEmail:     { type: String, required: true, lowercase: true, trim: true },
    stellarPublicKey: { type: String, required: true, index: true, sparse: true },
    isActive:         { type: Boolean, default: true, index: true },
    plan:             { type: String, enum: ['basic', 'standard', 'enterprise'], default: 'basic' },
  },
  { timestamps: true, versionKey: false }
);

export const ClinicModel = models.Clinic || model<Clinic>('Clinic', clinicSchema);

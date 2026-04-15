'use server';

import { getSupabase } from '@/lib/supabase';

function textOrNull(value: FormDataEntryValue | null): string | null {
  if (value == null || typeof value !== 'string') {
    return null;
  }
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function splitServiceAreas(raw: FormDataEntryValue | null): string[] {
  if (raw == null || typeof raw !== 'string') {
    return [];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function cuisineTypesFromForm(formData: FormData): string[] {
  const fromAll = formData
    .getAll('vendorType')
    .filter((v): v is string => typeof v === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromAll.length > 0) {
    return fromAll;
  }
  const one = formData.get('vendorType');
  if (typeof one === 'string' && one.trim()) {
    return [one.trim()];
  }
  return [];
}

export async function submitVendorApplication(formData: FormData): Promise<void> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase is not configured; cannot submit vendor application.');
  }

  const business_name = textOrNull(formData.get('truckName'));
  const contact_name = null;
  const email = textOrNull(formData.get('email'));
  const phone = null;
  const website = textOrNull(formData.get('website'));
  const instagram = textOrNull(formData.get('instagram'));
  const vendor_description =
    textOrNull(formData.get('vendorDescription')) ?? textOrNull(formData.get('whatYouServe'));
  const service_areas = splitServiceAreas(formData.get('serviceArea'));
  const cuisine_types = cuisineTypesFromForm(formData);

  const { error } = await client.from('vendor_applications').insert({
    business_name,
    contact_name,
    email,
    phone,
    website,
    instagram,
    vendor_description,
    service_areas,
    cuisine_types,
    base_city: null,
    photo_url: null,
    additional_photos: [],
    source: 'site',
  });

  if (error) {
    console.error(error);
    throw new Error(
      error.message
        ? `Failed to submit vendor application: ${error.message}`
        : 'Failed to submit vendor application.'
    );
  }
}

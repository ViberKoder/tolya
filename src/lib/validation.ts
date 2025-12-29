export interface ValidationError {
  field: string
  message: string
}

export interface JettonFormData {
  name: string
  symbol: string
  decimals: number
  description: string
  imageUrl: string
  totalSupply: string
  mintable: boolean
}

export function validateJettonForm(data: JettonFormData): ValidationError[] {
  const errors: ValidationError[] = []

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Token name is required' })
  } else if (data.name.length < 3) {
    errors.push({ field: 'name', message: 'Token name must be at least 3 characters' })
  } else if (data.name.length > 50) {
    errors.push({ field: 'name', message: 'Token name must not exceed 50 characters' })
  }

  // Symbol validation
  if (!data.symbol || data.symbol.trim().length === 0) {
    errors.push({ field: 'symbol', message: 'Token symbol is required' })
  } else if (data.symbol.length < 2) {
    errors.push({ field: 'symbol', message: 'Token symbol must be at least 2 characters' })
  } else if (data.symbol.length > 10) {
    errors.push({ field: 'symbol', message: 'Token symbol must not exceed 10 characters' })
  } else if (!/^[A-Z0-9]+$/i.test(data.symbol)) {
    errors.push({ field: 'symbol', message: 'Token symbol can only contain letters and numbers' })
  }

  // Description validation (optional but with limits)
  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must not exceed 500 characters' })
  }

  // Image URL validation (optional but must be valid URL if provided)
  if (data.imageUrl && data.imageUrl.trim().length > 0) {
    try {
      new URL(data.imageUrl)
      if (!data.imageUrl.match(/^https?:\/\//)) {
        errors.push({ field: 'imageUrl', message: 'Image URL must start with http:// or https://' })
      }
    } catch {
      errors.push({ field: 'imageUrl', message: 'Image URL must be a valid URL' })
    }
  }

  // Decimals validation
  if (data.decimals < 0 || data.decimals > 18) {
    errors.push({ field: 'decimals', message: 'Decimals must be between 0 and 18' })
  }

  // Total supply validation
  if (!data.totalSupply || data.totalSupply.trim().length === 0) {
    errors.push({ field: 'totalSupply', message: 'Total supply is required' })
  } else {
    const supply = parseFloat(data.totalSupply)
    if (isNaN(supply)) {
      errors.push({ field: 'totalSupply', message: 'Total supply must be a valid number' })
    } else if (supply < 0) {
      errors.push({ field: 'totalSupply', message: 'Total supply must be positive' })
    } else if (supply > Number.MAX_SAFE_INTEGER) {
      errors.push({ field: 'totalSupply', message: 'Total supply is too large' })
    }
  }

  return errors
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  if (errors.length === 1) return errors[0].message
  return `Please fix the following errors:\n${errors.map(e => `• ${e.message}`).join('\n')}`
}

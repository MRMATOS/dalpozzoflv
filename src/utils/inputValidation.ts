
// Utilitários para validação e sanitização de entrada
export const validateInput = {
  // Validar texto comum (nomes, descrições)
  text: (value: string, maxLength: number = 255): string => {
    if (!value || typeof value !== 'string') {
      throw new Error('Texto inválido');
    }
    
    const sanitized = value.trim().substring(0, maxLength);
    
    // Remover caracteres potencialmente perigosos
    const cleaned = sanitized.replace(/[<>\"']/g, '');
    
    if (cleaned.length === 0) {
      throw new Error('Texto não pode estar vazio');
    }
    
    return cleaned;
  },

  // Validar números
  number: (value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
    const num = Number(value);
    
    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Número inválido');
    }
    
    if (num < min || num > max) {
      throw new Error(`Número deve estar entre ${min} e ${max}`);
    }
    
    return num;
  },

  // Validar código de acesso
  codigoAcesso: (value: string): string => {
    if (!value || typeof value !== 'string') {
      throw new Error('Código de acesso inválido');
    }
    
    const cleaned = value.trim().replace(/[^a-zA-Z0-9]/g, '');
    
    if (cleaned.length < 3 || cleaned.length > 20) {
      throw new Error('Código de acesso deve ter entre 3 e 20 caracteres');
    }
    
    return cleaned;
  },

  // Validar UUID
  uuid: (value: string): string => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!value || !uuidRegex.test(value)) {
      throw new Error('ID inválido');
    }
    
    return value;
  },

  // Validar preço
  preco: (value: any): number => {
    const num = Number(value);
    
    if (isNaN(num) || !isFinite(num) || num < 0) {
      throw new Error('Preço inválido');
    }
    
    // Limitar a 2 casas decimais
    return Math.round(num * 100) / 100;
  }
};

// Sanitizar dados para prevenir XSS
export const sanitizeData = {
  // Sanitizar objeto recursivamente
  object: <T extends Record<string, any>>(obj: T): T => {
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = sanitizeData.string(value) as T[keyof T];
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key as keyof T] = sanitizeData.object(value) as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map(item => 
          typeof item === 'string' ? sanitizeData.string(item) : item
        ) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value;
      }
    }
    
    return sanitized;
  },

  // Sanitizar string
  string: (str: string): string => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

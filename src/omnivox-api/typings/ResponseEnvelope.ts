export interface CacheConfig {
    ListeCleCacheOverride: string[];
    TempsCache: number;
}

/**
 * Fields every Omnivox mobile API response carries around its payload.
 */
export interface ResponseEnvelope {
    Updating: boolean;
    IsPeriodeArret: boolean;
    NaviguerPage: string | null;
    DateRetourSysteme: number;
    CacheConfig: CacheConfig;
    IsAvailable: boolean;
}

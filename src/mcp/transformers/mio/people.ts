import { PeopleSearchResponse } from "@schemas/mio/people.schema"
import { MioSearch } from "@typings/Mio/Search"

function mapType(raw: number) {
    if (raw === 1) return "student" as const
    if (raw === 2) return "teacher" as const
    return "employee" as const
}

export function transformPeopleSearch(raw: MioSearch.IndividuItem[]): PeopleSearchResponse {
    const sorted = [...raw].sort((a, b) => b.TypeIndividu - a.TypeIndividu || a.TitreAffiche.localeCompare(b.TitreAffiche));
    return {
        count: sorted.length,
        results: sorted.map(p => ({
            id: p.OID,
            number: p.Numero,
            name: p.TitreAffiche,
            type: mapType(p.TypeIndividu),
            program: p.NomProgDept || undefined,
        })),
    }
}

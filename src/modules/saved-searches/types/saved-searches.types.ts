export type SavedSearchesFilterTypes = {
    location?: Array<string>,
    category?: string,
    type?:string
    bedrooms?: Array<string>,
    bathrooms?: Array<string>,
    minPrice?: number,
    maxPrice?: number,
    agency?: number,
    minArea?: number,
    maxArea?: number,
    rentalPeriod?: string
}

export type SavedSearchesAdminFilterTypes = {
    location?: Array<number>,
    state?:number[];
    id?: number;
    categoryId?: number[],
    typeIds?:number[]
    __bathrooms?: Array<string>,
    __bedrooms?: Array<string>,
    furnishingStatus: string
    minPrice?: number,
    maxPrice?: number,
    agency?: number[],
    agentIds?: number[]
    minArea?: number,
    slug?:string;
    maxArea?: number,
    rentalPeriod?: string,
    status?: number;
    title?: string;
}

export type PriceFilerTypes = {
    minPrice?: number,
    maxPrice?: number,
    rentalPeriod?: string
}

export type FiltersCompilation = {
    location?: string[],
    category?: string[],
    type?: string[],
    bedrooms?: string[],
    bathrooms?: string[],
    agency?: number[],
    minArea ?: number,
    maxArea?: number,
    priceFilter?: Array<PriceFilerTypes>
}
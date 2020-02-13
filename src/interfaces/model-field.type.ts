export interface IModelFieldTypes {
    fields: string[];
    showFields?: string[],
    sort: string;
    countLimit: number;
    extendQuery : {};
    populate: string;
    showPopulate?: string;
    populateSelect: string[];
    searchOr: string[];
}
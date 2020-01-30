export interface IModelFieldTypes {
    fields: string[];
    sort: string;
    countLimit: number;
    extendQuery : {};
    populate: string;
    populateSelect: string[];
    searchOr: string[];
}
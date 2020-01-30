import * as moment from 'moment';

import { Context } from 'koa';
import { IModelFieldTypes } from './interfaces/model-field.type';
import { Model } from 'mongoose';

export class KoaBaseController<T extends Model<any>> {
    constructor(
        protected readonly model: T,
        private readonly types: IModelFieldTypes,
    ) {}

    /**
     * Создание нового элемента
     */
    public async create(ctx: Context) {
        const item = await this.model.create({
            createdAt: new Date().getTime(),
            ...ctx.request.body,
        });

        ctx.body = {
            result: true,
            data: item,
        };
    };

    /**
     * Удаление элемента
     * @param {String} id идентификатор объекта
     */
    public async delete(ctx: Context) {
        const existItem = await this.model.findById(ctx.params.id);

        if (!existItem) {
            return (ctx.body = {
                result: false,
                note: `Элемента с id ${ctx.params.id} не существует`,
                code: 404,
            });
        }

        const result = await this.model.remove({ _id: ctx.params.id });

        ctx.body = {
            result: true,
            data: result,
        };
    };

    /**
     * Получение элемента по идинтификатору.
     * Популяция по внутренним полям
     * @param {String} id идентификатор объекта
     */
    public async show(ctx: Context) {
        const item = await this.model
            .findById(ctx.params.id)
            .select(this.types.fields)
            .populate(this.types.populate)
            .lean();

        ctx.body = {
            result: true,
            data: {
                ...ctx.mergedItem,
                ...item,
            },
        };
    };

    /**
     * Список элементов коллекции. для внутренних методов
     */
    public async getList(ctx: Context) {
        let query;
        if (ctx.query && ctx.query.query) {
            query = this.normalizeQuery(ctx.query.query);
        }

        let skip = 0;
        if (ctx.query.skip) {
            skip = parseInt(ctx.query.skip, 10);
        }

        let limit = this.types.countLimit;
        if (ctx.query.limit) {
            limit = parseInt(ctx.query.limit, 10);
        }

        if (this.types.extendQuery) {
            query = {
                ...query,
                ...this.types.extendQuery,
            };
        }

        if (ctx.extendQuery) {
            query = {
                ...query,
                ...this.types.extendQuery,
            };
        }

        const sort = ctx.query.sort
            ? ctx.query.sort.split(',')
            : this.types.sort;

        const itemsList = await this.model
            .find(query)
            .select(this.types.fields)
            .populate(this.types.populate)
            .sort(sort.toString())
            .skip(skip)
            .limit(limit)
            .lean();

        const itemsCount = await this.model.countDocuments(query);

        const fullItems = ctx.fullList
            ? await this.model.find(query)
            : [];

        return {
            list: itemsList,
            fullList: fullItems,
            count: itemsCount,
        };
    };

    /**
     * Список элементов коллекции.
     * Поддержка запроса поиска по полям
     */
    public async list(ctx: Context) {
        let query;
        if (ctx.query && ctx.query.query) {
            query = this.normalizeQuery(ctx.query.query);
        }

        let skip = 0;
        if (ctx.query.skip) {
            skip = parseInt(ctx.query.skip, 10);
        }

        let limit = this.types.countLimit;
        if (ctx.query.limit) {
            limit = parseInt(ctx.query.limit, 10);
        }

        if (this.types.extendQuery) {
            query = {
                ...query,
                ...this.types.extendQuery,
            };
        }

        if (ctx.extendQuery) {
            query = {
                ...query,
                ...this.types.extendQuery,
            };
        }

        const sort = ctx.query.sort
            ? ctx.query.sort.split(',')
            : this.types.sort;

        const itemsList = await this.model
            .find(query)
            .lean()
            .select(this.types.fields)
            .populate(
                this.types.populate,
                this.types.populateSelect,
            )
            .sort(sort.toString())
            .skip(skip)
            .limit(limit);

        const itemsCount = await this.model.countDocuments(query);

        ctx.body = {
            result: true,
            data: {
                list: itemsList,
                count: itemsCount,
            },
        };
    };

    /**
     * Обновление объекта
     * @param {String} id идентификатор объекта
     * @param {Object} ctx.request.body список полей
     */
    public async update(ctx: Context) {
        const updatedItem = {
            ...ctx.request.body,
            updatedAt: new Date().getTime(),
        };

        if (updatedItem._id) {
            delete updatedItem._id;
        }

        await this.model.updateOne({ _id: ctx.params.id }, updatedItem);

        const item = await this.model
            .findById(ctx.params.id)
            .select(this.types.fields);

        ctx.body = {
            result: true,
            data: item,
        };
    };

    private normalizeQuery(exportQuery: string): object {
        const query = JSON.parse(exportQuery);

        Object.keys(query).forEach(key => {
            if (typeof query[key] === 'object') {
                Object.keys(query[key]).forEach(subKey => {
                    this.normalizeQueryField(query[key], subKey);
                });
                if (Object.keys(query[key]).length === 0) {
                    delete query[key];
                }
            } else {
                this.normalizeQueryField(query, key);
            }
        });

        return query;
    }

    /**
     * Нормализация полей запроса для поиска по коллекции
     * @param {Object} obj объект запроса
     * @param {String} key поле запроса
     */
    private normalizeQueryField(obj: any, key: string) {
        if (obj[key] === '' || obj[key] === null) {
            delete obj[key];
        }

        if (obj[key] === 'false') {
            obj[key] = false;
        }

        if (obj[key] === 'true') {
            obj[key] = true;
        }

        if (key === '$or') {
            const orFields = this.types.searchOr.map(field => {
                return { [field]: new RegExp(obj[key], 'i') };
            });

            obj[key] = orFields;
        }

        if (typeof obj[key] === 'string') {
            const isDate = obj[key].match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

            if (isDate) {
                obj[key] = moment(obj[key]);

                if (key === '$lte') {
                    obj[key].hour(23).minute(59);
                }
                if (key === '$gte') {
                    obj[key].hour(0).minute(0);
                }
            }
        }
    }
}

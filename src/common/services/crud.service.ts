// src/common/services/common.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { Brackets, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

export interface CustomPaginatedResponse<T> {
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
    records: T[];
}

export interface IPaginateOptions<T extends ObjectLiteral> {
    queryBuilder: SelectQueryBuilder<T>;
    alias?: string;
    sortField?: string; // e.g., 'conversation.sort_id' or 'lastMessage.sort_id'
    cursor?: { createdAt: Date; id: string };    // The ULID string from the last item
    limit?: number;
    sort?: "DESC" | "ASC"
}

export class CRUD {
    static async paginateCursor<T extends ObjectLiteral>(options: IPaginateOptions<T>) {
        const {
            queryBuilder,
            alias = 'entity',
            sortField = `${alias}.created_at`,
            cursor,
            limit = 50,
            sort = 'DESC'
        } = options;


        if (cursor) {
            queryBuilder.andWhere(
                `(${alias}.created_at, ${alias}.id) < (:createdAt, :id)`,
                { createdAt: cursor.createdAt, id: cursor.id }
            );
        }

        queryBuilder
            .orderBy(sortField, sort)
            .addOrderBy(`${alias}.id`, sort)
            .take(limit + 1);

        const items = await queryBuilder.getMany();

        // 3. Logic for "hasMore" and nextCursor
        const hasMore = items.length > limit;

        if (hasMore) items.pop();

        const nextCursor = hasMore
            ? {
                createdAt: (items[items.length - 1] as any).created_at,
                id: (items[items.length - 1] as any).id,
            }
            : null;

        return { items, nextCursor, hasMore };
    }

    private static flatten(obj: any, prefix = ''): Record<string, any> {
        let result: Record<string, any> = {};

        Object.entries(obj).forEach(([key, value]) => {
            const prefixedKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' &&
                value !== null &&
                !Array.isArray(value)
            ) {
                // Detect operator objects (contain keys like not, isNull, in, like)
                const operatorKeys = ['not', 'isNull', 'in', 'like'];
                const isOperatorObject = Object.keys(value).some(k =>
                    operatorKeys.includes(k)
                );

                if (isOperatorObject) {
                    // Preserve operator object as-is
                    result[prefixedKey] = value;
                } else {
                    // Normal nested object → keep flattening
                    Object.assign(result, this.flatten(value, prefixedKey));
                }
            } else {
                result[prefixedKey] = value;
            }
        });

        return result;
    }

    private static buildBaseQuery<T extends ObjectLiteral>(
        repository: Repository<T>,
        entityName: string,
        search?: string,
        sortBy?: string,
        sortOrder: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC',
        relations?: string[],
        searchFields?: string[],
        filters?: Record<string, any>,
        extraSelects?: string[],
    ): SelectQueryBuilder<T> {

        if (!['ASC', 'DESC', 'asc', 'desc'].includes(sortOrder)) {
            throw new BadRequestException("Sort order must be either 'ASC' or 'DESC'.");
        }

        const query = repository.createQueryBuilder(entityName);

        if (extraSelects?.length) {
            extraSelects.forEach(col => {
                query.addSelect(`${entityName}.${col}`);
            });
        }

        if (filters && Object.keys(filters).length > 0) {
            const flatFilters = this.flatten(filters);
            Object.entries(flatFilters).forEach(([flatKey, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    const paramKey = flatKey.replace(/\./g, '_');
                    // Handle explicit null
                    if (value === null) {
                        query.andWhere(`${entityName}.${flatKey} IS NULL`);
                        return;
                    }

                    // Handle special operators
                    if (typeof value === 'object' && value !== null) {
                        // Example: { not: 5 } → NOT EQUAL
                        if ('not' in value) {
                            query.andWhere(`${entityName}.${flatKey} != :${paramKey}`, {
                                [paramKey]: value.not,
                            });
                            return;
                        }

                        // Example: { isNull: true } → IS NULL
                        if (value.isNull === true) {
                            query.andWhere(`${entityName}.${flatKey} IS NULL`);
                            return;
                        }

                        // Example: { isNull: false } → IS NOT NULL
                        if (value.isNull === false) {
                            query.andWhere(`${entityName}.${flatKey} IS NOT NULL`);
                            return;
                        }

                        if ('in' in value) {
                            query.andWhere(`${entityName}.${flatKey} IN (:...${paramKey})`, {
                                [paramKey]: value.in,
                            });
                            return;
                        }

                    }
                    // Default: equality
                    query.andWhere(`${entityName}.${flatKey} = :${paramKey}`, {
                        [paramKey]: value,
                    });

                }
            });
        }

        if (search && searchFields && searchFields?.length >= 1) {
            query.andWhere(
                new Brackets(qb => {
                    searchFields.forEach(field => {
                        if (field.includes('.')) {
                            const [columnName, jsonKey] = field.split('.');
                            const columnMetadata = repository.metadata.columns.find(col => col.propertyName === columnName);

                            if (columnMetadata?.type === 'jsonb') {
                                // Postgres syntax: column->>'key' gets the value as text
                                qb.orWhere(`LOWER(${entityName}.${columnName}->>'${jsonKey}') LIKE LOWER(:search)`, {
                                    search: `%${search}%`
                                });
                                return; // Skip the rest of the loop for this field
                            }
                        }

                        const columnMetadata = repository.metadata.columns.find(col => col.propertyName === field);
                        if (columnMetadata?.type === 'jsonb') {
                            qb.orWhere(`LOWER(${entityName}.${field}::text) LIKE LOWER(:search)`, { search: `%${search}%` });
                        } else if (columnMetadata?.type === String || columnMetadata?.type == 'text') {
                            qb.orWhere(`LOWER(${entityName}.${field}) LIKE LOWER(:search)`, {
                                search: `%${search}%`,
                            });
                        } else if (['decimal', 'float'].includes(columnMetadata?.type as any)) {
                            const numericSearch = parseFloat(search);
                            if (!isNaN(numericSearch))
                                qb.orWhere(`${entityName}.${field} = :numericSearch`, {
                                    numericSearch,
                                });
                        } else if (columnMetadata?.type === 'enum') {
                            const enumValues = columnMetadata.enum;
                            if (enumValues?.length && enumValues.includes(search)) {
                                qb.orWhere(`${entityName}.${field} = :value`, {
                                    value: search,
                                });
                            } else {
                                throw new BadRequestException(`Invalid value '${search}' for enum field '${field}'. Allowed values: ${enumValues?.join(', ')}`);
                            }
                        } else {
                            qb.orWhere(`${entityName}.${field} = :search`, { search });
                        }
                    });
                }),
            );
        }

        if (relations?.length && relations?.length > 0) {
            const invalidRelations = relations.filter(relation => !repository.metadata.relations.some(rel => rel.propertyName === relation));
            if (invalidRelations.length > 0) {
                throw new BadRequestException(`Invalid relations: ${invalidRelations.join(', ')}`);
            }
            relations.forEach(relation => {
                query.leftJoinAndSelect(`${entityName}.${relation}`, relation);
            });
        }

        const defaultSortBy = 'created_at';
        const sortField = sortBy || defaultSortBy;
        const sortDirection: 'ASC' | 'DESC' = (sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

        const columnExists = repository.metadata.columns.some(col => col.propertyName === sortField);
        if (!columnExists) {
            throw new BadRequestException(`Invalid sortBy field: '${sortField}'`);
        }


        query.orderBy(`${entityName}.${sortField}`, sortDirection);


        return query;
    }
    static async findAll<T extends ObjectLiteral>(
        repository: Repository<T>,
        entityName: string,
        search?: string,
        page: any = 1,
        limit: any = 10,
        sortBy?: string,
        sortOrder: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC',
        relations?: string[],
        searchFields?: string[],
        filters?: Record<string, any>,
        extraSelects?: string[],
    ): Promise<CustomPaginatedResponse<T>> {

        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 10;

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            throw new BadRequestException('Pagination parameters must be valid numbers greater than 0.');
        }
        // const skip = (pageNumber - 1) * limitNumber;
        // const query = repository.createQueryBuilder(entityName).skip(skip).take(limitNumber);
        const query = CRUD.buildBaseQuery(
            repository, entityName, search, sortBy, sortOrder, relations, searchFields, filters, extraSelects
        );
        const skip = (pageNumber - 1) * limitNumber;
        query.skip(skip).take(limitNumber);

        const [data, total] = await query.getManyAndCount();

        const pagination = {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limit),
        };

        return { records: data, pagination }
    }

    static async findAllLimited<T extends ObjectLiteral>(
        repository: Repository<T>,
        entityName: string,
        limit: number = 10, // Required, e.g. 1000
        search?: string,
        sortBy?: string,
        sortOrder: 'ASC' | 'DESC' | 'asc' | 'desc' = 'DESC',
        relations?: string[],
        searchFields?: string[],
        filters?: Record<string, any>,
        extraSelects?: string[],
    ): Promise<CustomPaginatedResponse<T>> {

        const limitNumber = Number(limit);
        if (limitNumber < 1) {
            throw new BadRequestException('Limit must be greater than 0.');
        }

        // 1. Get Base Query
        const query = CRUD.buildBaseQuery(
            repository, entityName, search, sortBy, sortOrder, relations, searchFields, filters, extraSelects
        );

        // 2. Apply Limit Only (No Skip)
        query.take(limitNumber);

        // 3. Execute
        // We still use getManyAndCount to provide consistent response structure
        const [data, total] = await query.getManyAndCount();

        return {
            records: data,
            pagination: {
                page: 1, // Always page 1 because it's a flat list
                limit: limitNumber,
                total,
                totalPages: 1, // Always 1 "page" of data
            }
        };
    }
}
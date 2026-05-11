import { Contract } from "../entities/contract.entity";
import { RenewRequest } from "../entities/renew_request";
import { UserRole } from "../entities/user.entity";

export class ContractDataMasker {

    static maskRenew(data: RenewRequest | RenewRequest[], role: UserRole): any {
        // إذا كان الأدمن، نعيد البيانات كما هي
        if (role === UserRole.ADMIN) return data;

        if (Array.isArray(data)) {
            return data.map((renew) => this.maskSingleRenew(renew));
        }

        return this.maskSingleRenew(data);
    }

    private static maskSingleRenew(renew: RenewRequest): any {
        // ننسخ كائن التجديد
        const maskedRenew = { ...renew };

        // إذا كان العقد الأصلي موجوداً ضمن العلاقة، نقوم بتطبيق القناع عليه
        if (maskedRenew.originalContract) {
            maskedRenew.originalContract = this.maskSingleContract(maskedRenew.originalContract);
        }

        return maskedRenew;
    }


    static mask(data: Contract | Contract[], role: UserRole): any {
        if (role === UserRole.ADMIN) return data;

        if (Array.isArray(data)) {
            return data.map((c) => this.maskSingleContract(c));
        }
        return this.maskSingleContract(data);
    }

    private static maskSingleContract(contract: Contract): any {
        const masked = { ...contract };

        // 1. معالجة الـ Snapshots (البيانات التاريخية داخل العقد)
        if (masked.tenantSnapshot) {
            masked.tenantSnapshot = this.maskUser(masked.tenantSnapshot);
        }
        if (masked.landlordSnapshot) {
            masked.landlordSnapshot = this.maskUser(masked.landlordSnapshot);
        }
        if (masked.propertySnapshot) {
            masked.propertySnapshot = this.maskProperty(masked.propertySnapshot);
        }

        // 2. معالجة العلاقات المباشرة (Live Relations) إذا كانت موجودة
        if (masked.tenant) {
            masked.tenant = this.maskUser(masked.tenant as any);
        }
        if (masked.landlord) {
            masked.landlord = this.maskUser(masked.landlord as any);
        }
        if (masked.property) {
            masked.property = this.maskProperty(masked.property as any);
        }

        return masked;
    }

    private static maskString(value: any): string {
        if (!value || typeof value !== 'string') return '********';
        if (value.length <= 2) return value[0] + '***'; // للحقول القصيرة جداً
        return `${value[0]}***${value[value.length - 1]}`;
    }

    private static maskUser(user: any) {
        return {
            ...user,
            // للبريد الإلكتروني، نظهر أول حرف وآخر حرف من الجزء قبل @ والجزء الأخير من الدومين
            email: user.email ? `${user.email[0]}***${user.email.split('@')[0].slice(-1)}@${user.email.split('@')[1]}` : '***@***.com',
            phoneNumber: this.maskString(user.phoneNumber),
            identityNumber: this.maskString(user.identityNumber),
            shortAddress: this.maskString(user.shortAddress),
        };
    }

    private static maskProperty(prop: any) {
        const maskedProp = { ...prop };

        const secretFields = [
            'documentImagePath', 'ownerIdNumber', 'documentNumber',
            'gasMeterNumber', 'electricityMeterNumber', 'waterMeterNumber',
            'insurancePolicyNumber', 'electricityMeter', 'waterMeter', 'gasMeter'
        ];

        secretFields.forEach(field => {
            // تشفير الحقل في المستوى الأول
            if (maskedProp[field]) {
                maskedProp[field] = this.maskString(maskedProp[field]);
            }

            // التعامل مع الكائن المتداخل ownershipDocument (في الـ Snapshot)
            if (maskedProp.ownershipDocument) {
                // ملاحظة: الـ Snapshot يستخدم 'imagePath' بدلاً من 'documentImagePath'
                const snapshotFieldMap: Record<string, string> = {
                    'documentImagePath': 'imagePath',
                    'documentNumber': 'number',
                    'ownerIdNumber': 'ownerIdNumber'
                };

                const targetField = snapshotFieldMap[field] || field;
                if (maskedProp.ownershipDocument[targetField]) {
                    maskedProp.ownershipDocument[targetField] = this.maskString(maskedProp.ownershipDocument[targetField]);
                }
            }
        });

        return maskedProp;
    }
}
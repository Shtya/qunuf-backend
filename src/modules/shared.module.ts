// shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { ExportService } from 'src/common/services/exportService';


@Global()
@Module({
    providers: [ExportService],
    exports: [ExportService], // 👈 Must export it to make it accessible
})
export class SharedModule { }
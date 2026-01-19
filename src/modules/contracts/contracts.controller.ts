import { Controller, Post, Body, Patch, Param, UseInterceptors, UseGuards, UploadedFile, BadRequestException, Get, Query, Res } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ApiBody, ApiConsumes, ApiForbiddenResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { UserRole } from 'src/common/entities/user.entity';
import { ReviseContractDto } from './dto/revise-contract.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileUploadConfig } from 'src/common/utils/file.util';
import { Auth } from 'src/common/decorators/auth.decorator';
import { AcceptContractDto } from './dto/accept-contract-dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ContractFilterDto } from './dto/contract-filter.dto';
import { ActivateContractDto } from './dto/activate.contract.dto';
import { RenewFilterDto } from './dto/renew_filter.dto';
import { Response } from 'express';

@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
  ) { }

  @Post()
  @Auth(UserRole.TENANT) // Only Tenants start the process
  @ApiOperation({ summary: 'Tenant creates a new contract proposal' })
  @ApiResponse({ status: 201, description: 'Contract created successfully, waiting for landlord.' })
  @ApiResponse({ status: 400, description: 'Validation failed or Profile incomplete.' })
  create(@User() user: any, @Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(user.id, createContractDto);
  }

  @Patch(':id/landlord-revise')
  @Auth(UserRole.LANDLORD)
  @ApiOperation({ summary: 'Landlord edits terms and sends back to tenant' })
  @ApiBody({ schema: { properties: { terms: { type: 'string', example: 'New revised terms here...' } } } })
  @ApiResponse({ status: 200, description: 'Contract terms updated and status changed to pending_tenant_acceptance.' })
  async landlordRevise(
    @Param('id') id: string,
    @User() user: any,
    @Body() reviceDto: ReviseContractDto
  ) {
    return this.contractsService.landlordUpdateTerms(id, user.id, reviceDto.newTerms);
  }

  @Post(':id/accept')
  @Auth(UserRole.LANDLORD, UserRole.TENANT)
  @ApiOperation({ summary: 'Accept the contract (Tenant or Landlord)' })
  @ApiResponse({ status: 200, description: 'Contract accepted. Status moved to pending_signature.' })
  async accept(@Param('id') id: string, @User() user: any, @Body() @Body() dto: AcceptContractDto) {
    // Note: service handles the internal logic of who can accept based on status
    return this.contractsService.acceptContract(id, user.id, dto);
  }

  @Post(':id/cancel')
  @Auth(UserRole.LANDLORD, UserRole.TENANT)
  @ApiOperation({ summary: 'Cancel the contract (Tenant or Landlord)' })
  @ApiResponse({ status: 200, description: 'Contract cancelled successfully.' })
  async cancel(@Param('id') id: string, @User() user: any) {
    return this.contractsService.cancelContract(id, user.id);
  }

  @Patch(':id/activate-ejar')
  @Auth(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('contractPdf', fileUploadConfig('contracts')))
  @ApiOperation({ summary: 'Admin activates contract by uploading Ejar PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contractPdf: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Contract activated and Ejar PDF uploaded.' })
  async activateContract(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() dto: ActivateContractDto
  ) {
    if (!file) throw new BadRequestException('Ejar Contract PDF is required');

    const pdfPath = `uploads/documents/contracts/${file.filename}`;
    return this.contractsService.activateAndUploadPdf(id, pdfPath, dto.contractNumber);
  }

  @Post(':id/terminate')
  @Auth(UserRole.TENANT, UserRole.LANDLORD)
  @ApiOperation({ summary: 'Terminate contract (Tenant: Immediate / Landlord: 60-day notice)' })
  async terminate(@Param('id') id: string, @User() user: any) {
    return this.contractsService.terminateContract(id, user.id);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async export(
    @User() user: any,
    @Query() query: ContractFilterDto,
    @Res() res: Response
  ) {
    const buffer = await this.contractsService.exportContracts(user, query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=contracts_export_${Date.now()}.xlsx`);

    return res.send(buffer);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get contract details (Admin or Participant only)' })
  @ApiResponse({ status: 200, description: 'Return contract details' })
  @ApiForbiddenResponse({ description: 'You are not authorized to view this contract' })
  async getContractDetails(
    @Param('id') id: string,
    @User() user: any,
  ) {
    return this.contractsService.getContractById(id, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Search and filter contracts (Authorized access only)' })
  async getAllContracts(@User() user: any, @Query() query: ContractFilterDto) {
    return this.contractsService.findAll(user, query);
  }

  @Post('renew/:requestId/accept')
  @Auth(UserRole.TENANT)
  @ApiOperation({ summary: 'Tenant accepts a renewal offer and creates a new contract' })
  async acceptRenewOffer(
    @Param('requestId') requestId: string,
    @User() user: any
  ) {
    return this.contractsService.acceptRenewOffer(requestId, user.id);
  }

  @Patch('renew/:requestId/reject')
  @Auth(UserRole.TENANT)
  @ApiOperation({ summary: 'Tenant rejects a renewal offer' })
  async rejectRenewOffer(
    @Param('requestId') requestId: string,
    @User() user: any
  ) {
    return this.contractsService.rejectRenewOffer(requestId, user.id);
  }


  @Get('renews/my-offers')
  @Auth(UserRole.TENANT)
  @ApiOperation({ summary: 'Get all renewal offers for the current tenant' })
  async getMyRenewOffers(
    @User() user: any,
    @Query() query: RenewFilterDto
  ) {
    return this.contractsService.findAllRenewRequests(user, query);
  }

  @Get('check-eligibility/:propertyId')
  @Auth(UserRole.TENANT)
  @ApiOperation({ summary: 'Check if tenant can create a contract for a specific property' })
  async checkEligibility(
    @User() user: any,
    @Param('propertyId') propertyId: string
  ) {
    return this.contractsService.allowToCreateContract(user.id, propertyId);
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard statistics (Admin/Landlord/Tenant)' })
  async getDashboardStats(@User() user: any) {
    return this.contractsService.getDashboardStats(user);
  }

  @Get('dashboard/chart-data')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get chart data for dashboard (contracts per day, status breakdown)' })
  async getDashboardChartData(@User() user: any) {
    return this.contractsService.getDashboardChartData(user);
  }

  @Get('dashboard/recent')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get recent contracts for dashboard' })
  async getRecentContracts(@User() user: any) {
    return this.contractsService.getRecentContracts(user);
  }


}

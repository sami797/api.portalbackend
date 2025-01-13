import { ApiProperty } from "@nestjs/swagger";
import { Project as __Project } from "@prisma/client";
export class Project implements Partial<__Project> {
    @ApiProperty()
    id: number;
    
    @ApiProperty()
    slug: string;
    
    @ApiProperty()
    title: string;
    
    @ApiProperty()
    departmentId: number | null;
    
    @ApiProperty()
    submissionById: number | null;
    
    @ApiProperty()
    clientId: number | null;
    
    @ApiProperty()
    projectTypeId: number | null;
    
    @ApiProperty()
    referenceNumber: string | null;
    
    @ApiProperty()
    itemListforApproval: string | null;
    
    @ApiProperty()
    instructions: string | null;
    
    @ApiProperty()
    scopeOfWork: string | null;
    
    @ApiProperty()
    projectFilesLink: string | null;
    
    @ApiProperty()
    components: number[];
    
    @ApiProperty()
    authorities: number[];
    
}


export enum ProjectDocumentsTypes {
    "drawings" = "drawings",
    "Requirement Documents" = "requirement_documents",
    "Structural Drawings" = "structural_drawings",
    "Interior Design" = "interior_design",
    "Invoice" = "invoice",
    "Government Document" = "government_document",
    "permit" = "permit",
    "other" = "other"
}
type PrismaErrorCode = string;
const prismaHttpMap = (prismaErrorCode : PrismaErrorCode) => {
    switch(prismaErrorCode){
        case "" : return 500;
        case 'P2000': return  500;
        case 'P2001': return  500;
        case 'P2002': return  400;
        case 'P2003': return  400;
        case 'P2004': return  400;
        case 'P2005': return  400;
        case 'P2006': return  400;
        case 'P2007': return  400;
        case 'P2008': return  400;
        case 'P2009': return  400;
        case 'P2010': return  400;
        case 'P2011': return  400;
        case 'P2012': return  400;
        case 'P2013': return  400;
        case 'P2014': return  400;
        case 'P2015': return  400;
        case 'P2016': return  400;
        case 'P2017': return  400;
        case 'P2018': return  400;
        case 'P2019': return  400;
        case 'P2020': return  400;
        case 'P2021': return  400;
        case 'P2022': return  400;
        case 'P2023': return  400;
        case 'P2024': return  400;
        case 'P2025': return  400;
        case 'P2026': return  400;
        case 'P2027': return  400;
        case 'P2028': return  400;
        case 'P2029': return  400;
        case 'P2030': return  400;
        default : return 400;
    }
}
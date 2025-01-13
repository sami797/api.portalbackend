import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { AttendanceReportSheetDto } from './dto/attendance-report-sheet.dto';
import { convertDate, getEnumKeyByEnumValue } from 'src/helpers/common';
import { AttendanceStatus, WeekDays } from 'src/config/constants';
import * as moment from 'moment';
import { PayrollReportSheetDto } from './dto/payroll-report-sheet.dto';

@Injectable()
export class ExcelService {
  async attendanceExcelReport(sheets: AttendanceReportSheetDto[], fileName: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();

    await Promise.all(sheets.map(async (sheet) => {

      if(!sheet || !sheet.data){
        return;
      }
      
      const employee = sheet.data.employee;

      const worksheet = workbook.addWorksheet(sheet.sheetName);

      // Add employee data
      worksheet.addRow(["Employee System ID", employee.id]);
      worksheet.addRow(["Employee Name", employee.firstName + " " + employee.lastName]);
      worksheet.addRow(["Department", employee.Department?.title]);
      worksheet.addRow(["Date Joined", (employee.dateOfJoining) ? convertDate(employee.dateOfJoining, 'M dd,yy') : ""]);
      worksheet.addRow([]);
      worksheet.addRow([]);

      // Set column widths
      worksheet.columns = [
        { width: 20 }, 
        { width: 20 }, 
        {width: 10},
        {width: 10},
        {width: 10},
        {width: 10},
        {width: 15},
        {width: 30}
      ];
      
      // Add attendance data starting from row 6
      worksheet.addRow(["Day", "Date", "Check in", "Check out", "Total Hrs", "Deduction", "Status", "Note"]);
      sheet.data.attendance.forEach((attendance) => {
        let t = worksheet.addRow([
          getEnumKeyByEnumValue(WeekDays, new Date(attendance.day).getDay()).toUpperCase(),
          convertDate(attendance.day, 'dd/mm/yy'),
          (attendance.checkIn) ? moment(attendance.checkIn).format("HH:mm") : "",
          (attendance.checkOut) ? moment(attendance.checkOut).format("HH:mm") : "",
          attendance.totalHours || 0,
          attendance.proRatedDeduction,
          getEnumKeyByEnumValue(AttendanceStatus, attendance.status).toUpperCase(),
          attendance.note
        ]);

        if( attendance.status === AttendanceStatus.off){
          let cell = t.getCell(1);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC7CE' },
          };

          cell.font = {
            color: { argb: '9C0006' }
          }
        }

        if( attendance.status === AttendanceStatus.incomplete){
          let cell = t.getCell(7);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC7CE' },
          };

          cell.font = {
            color: { argb: '9C0006' }
          }
        }

        if( attendance.status === AttendanceStatus.absent){
          let cell = t.getCell(7);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'C39892' },
          };

          cell.font = {
            color: { argb: '881202' }
          }
        }

        if( attendance.status === AttendanceStatus.incomplete){
          let cell = t.getCell(7);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC7CE' },
          };

          cell.font = {
            color: { argb: '9C0006' }
          }
        }

        if( attendance.status === AttendanceStatus.late){
          let cell = t.getCell(7);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'EDD9CC' },
          };

          cell.font = {
            color: { argb: 'D35E0F' }
          }
        }

      });

      ["A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7"].forEach((ele) => {
        let cell = worksheet.getCell(ele);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2f2f2' },
        };

        cell.font = {
          bold: true,
          color: { argb: '993300' }
        }
      });

      ["A1", "A2", "A3", "A4"].forEach((ele) => {
        worksheet.getCell(ele).font = {
          bold: true,
          color: { argb: '000080' }
        };
      });

      ["B1", "B2", "B3", "B4"].forEach((ele) => {
        worksheet.getCell(ele).font = {
          bold: true,
          color: { argb: '000000' }
        };
      });

    }));

    await workbook.xlsx.writeFile(fileName);
    return fileName;
  }

  async PayrollExcelReport(sheets: PayrollReportSheetDto[], fileName: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const reportSummary = workbook.addWorksheet("Report Summary");

    let payrollMonth = sheets.length > 0 ? sheets[0].data?.payroll?.monthYear : "";
    let a1 = reportSummary.addRow(["PAYROLL REPORT"]);
    let monthName = payrollMonth ? convertDate(payrollMonth, 'MM yy') : "";
    console.log(payrollMonth, monthName);
    let a2 = reportSummary.addRow(["MONTH ENDING " + monthName.toUpperCase()]);
    reportSummary.mergeCells('A1:C1');
    reportSummary.mergeCells('A2:C2');
    a1.font = {
      bold: true,
      size: 16,
      color: { argb: '008000' }
    }
    a2.font = {...a1.font, size: 12}

    let reportHeader = reportSummary.addRow(["Emp ID", "Employee Name", "Total Days in Pay Cycle", "Total Working Days", "Days Worked", "To Be Deduced in Leave Credits", "Total no. of Absences (salary deduct) (Late Equivalent + Absent)", "Manual Correction", "Salary", "Receivable"]);
    reportHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'e1efd9' },
    };

    reportHeader.font = {
      bold: true,
      size: 10,
      
      color: { argb: '000000' }
    };

    reportHeader.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    }

    reportSummary.columns = [
      { width: 8 }, 
      { width: 30 }, 
      {width: 14},
      {width: 14},
      {width: 14},
      {width: 14},
      {width: 24},
      {width: 14},
      {width: 14},
      {width: 14}
    ];

    reportSummary.views = [
      {
        state: 'frozen',
        xSplit: 2,
        ySplit: 3,
      },
    ];


    await Promise.all(sheets.map(async (sheet) => {
      if(!sheet || !sheet.data){
        return;
      }
      const employee = sheet.data.employee;
      const payroll = sheet.data.payroll;

      const worksheet = workbook.addWorksheet(sheet.sheetName);
      //Add Row in Report Summary
      let row = reportSummary.addRow([employee.id, employee.firstName + " " + employee.lastName, payroll.totalDays, payroll.totalWorkingDays, payroll.totalDaysWorked, payroll.toBeDeductedFromLeaveCredits, payroll.toBeDeductedFromCurrentSalary, payroll.manualCorrection, payroll.salaryAmount, payroll.totalReceivable])
      if(payroll.toBeDeductedFromCurrentSalary > 0){
        let cell = row.getCell(7);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC7CE' },
        };

        cell.font = {
          color: { argb: '9C0006' }
        }
      }
      // Add employee data
      worksheet.addRow(["Employee ID", employee.id]);
      worksheet.addRow(["Employee Name", employee.firstName + " " + employee.lastName]);
      worksheet.addRow(["Department", employee.Department?.title]);
      worksheet.addRow(["Date Joined", (employee.dateOfJoining) ? convertDate(employee.dateOfJoining, 'M dd,yy') : ""]);
      worksheet.addRow([]);

      // Set column widths
      worksheet.columns = [
        { width: 15 }, 
        { width: 18 }, 
        {width: 10},
        {width: 10},
        {width: 10},
        {width: 10},
        {width: 15},
        {width: 20},
        {width: 30},
        {width: 15}
      ];
      
      // Add attendance data starting from row 6
      let attendanceHeader = worksheet.addRow(["Day", "Date", "Check in", "Check out", "Total Hrs", "Deduction", "Status", "Note"]);
      sheet.data.attendance.forEach((attendance) => {
        let t = worksheet.addRow([
          getEnumKeyByEnumValue(WeekDays, new Date(attendance.day).getDay()).toUpperCase(),
          convertDate(attendance.day, 'dd/mm/yy'),
          (attendance.checkIn) ? moment(attendance.checkIn).format("HH:mm") : "",
          (attendance.checkOut) ? moment(attendance.checkOut).format("HH:mm") : "",
          attendance.totalHours || 0,
          attendance.proRatedDeduction,
          getEnumKeyByEnumValue(AttendanceStatus, attendance.status).toUpperCase(),
          attendance.note
        ]);

        if( attendance.status === AttendanceStatus.off){
          let cell = t.getCell(1);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E7F2E7' },
          };

          cell.font = {
            color: { argb: '2C4D2C' }
          }
        }

        if( attendance.status === AttendanceStatus.incomplete){
          let cell = t.getCell(7);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC7CE' },
          };

          cell.font = {
            color: { argb: '9C0006' }
          }
        }

        if( attendance.status === AttendanceStatus.absent){
          let cell = t.getCell(7);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'C39892' },
          };

          cell.font = {
            color: { argb: '881202' }
          }
        }

        if( attendance.status === AttendanceStatus.incomplete){
          let cell = t.getCell(7);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC7CE' },
          };

          cell.font = {
            color: { argb: '9C0006' }
          }
        }

        if( attendance.status === AttendanceStatus.late){
          let cell = t.getCell(7);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'EDD9CC' },
          };

          cell.font = {
            color: { argb: 'D35E0F' }
          }
        }

      });

      // ["A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6"].forEach((ele) => {
        // let cell = worksheet.getCell(ele);
        attendanceHeader.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2f2f2' },
        };

        attendanceHeader.font = {
          bold: true,
          color: { argb: '993300' }
        };
      // });

      ["A1", "A2", "A3", "A4"].forEach((ele) => {
        worksheet.getCell(ele).font = {
          bold: true,
          color: { argb: '000080' }
        };
      });

      ["B1", "B2", "B3", "B4"].forEach((ele) => {
        worksheet.getCell(ele).font = {
          bold: true,
          color: { argb: '000000' }
        };
      });

      let i6 = worksheet.getCell("I6");
      let i7 = worksheet.getCell("I7");
      let i8 = worksheet.getCell("I8");
      let i9 = worksheet.getCell("I9");
      let i10 = worksheet.getCell("I10");
      let i11 = worksheet.getCell("I11");
      let i12 = worksheet.getCell("I12");
      let i13 = worksheet.getCell("I13");
      let i14 = worksheet.getCell("I14");
      let i15 = worksheet.getCell("I15");
      let i16 = worksheet.getCell("I16");
      let i17 = worksheet.getCell("I17");
      let i18 = worksheet.getCell("I18");

      let j6 = worksheet.getCell("J6");
      let j7 = worksheet.getCell("J7");
      let j8 = worksheet.getCell("J8");
      let j9 = worksheet.getCell("J9");
      let j10 = worksheet.getCell("J10");
      let j11 = worksheet.getCell("J11");
      let j12 = worksheet.getCell("J12");
      let j13 = worksheet.getCell("J13");
      let j14 = worksheet.getCell("J14");
      let j15 = worksheet.getCell("J15");
      let j16 = worksheet.getCell("J16");
      let j17 = worksheet.getCell("J17");
      let j18 = worksheet.getCell("J18");

      i6.value = "Total Days in Cycle";
      i7.value = "Total Working Days";
      i8.value = "Total Days Worked";
      i9.value = "Total No. of Lates";
      i10.value = "Lates Equivalent to Absences";
      i11.value = "Absences";
      i12.value = "Incomplete";
      i13.value = "Manual Update";
      i14.value = "Total Absenses";
      i15.value = "To be deducted in Leave Credits";
      i16.value = "To be deducted in current salary";
      i17.value = "Total Salary"
      i18.value = "Receivable"

      j6.value = payroll.totalDays;
      j7.value = payroll.totalWorkingDays;
      j8.value = payroll.totalDaysWorked;
      j9.value = payroll.totalLates;
      let deductionDaysCount = Math.floor(payroll.totalLates / 3);
      j10.value = (deductionDaysCount >= 1) ? deductionDaysCount : 0;
      j11.value = payroll.totalAbsences;
      j12.value = payroll.totalIncompletes;
      j13.value = payroll.manualCorrection;
      let totalAbsencesIncludingIncompletes = ((deductionDaysCount >= 1) ? deductionDaysCount : 0) + payroll.totalAbsences + payroll.totalIncompletes;
      j14.value = totalAbsencesIncludingIncompletes;
      j15.value = payroll.toBeDeductedFromLeaveCredits;
      j16.value = payroll.toBeDeductedFromCurrentSalary;
      j17.value = payroll.salaryAmount
      j18.value = payroll.totalReceivable

      j18.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'C9D9C9' },
      };

      j18.font = {
        bold: true,
        size: 16,
        color: { argb: '008000' }
      }

      i18.fill = {...j18.fill}
      i18.font = {...j18.font}

      if(deductionDaysCount >= 1){
        j10.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC7CE' },
        };

        j10.font = {
          color: { argb: '9C0006' }
        }
      }
      if(payroll.toBeDeductedFromCurrentSalary > 0){
        j16.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC7CE' },
        };

        j16.font = {
          color: { argb: '9C0006' }
        }
      }

      if(totalAbsencesIncludingIncompletes > 0){
        j14.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC7CE' },
        };

        j14.font = {
          color: { argb: '9C0006' }
        }
      }

    }));

    await workbook.xlsx.writeFile(fileName);
    return fileName;
  }
}

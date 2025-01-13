import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { InvoiceItem, QuotationMilestone, TaxRate } from '@prisma/client';
export const generateUUID = () => {
	return uuidv4();
}

export type TypeFromEnumValues<T extends object> = T[keyof T];

export function getEnumKeyByEnumValue(myEnum: any, enumValue: number | string): string {
	let keys = Object.keys(myEnum).filter((x) => myEnum[x] == enumValue);
	return keys.length > 0 ? keys[0] : '';
}

export const toSentenceCase = (str : string) => {
	if(!str){
		return ""
	}
	str = str.toLowerCase();
	const s =
	  str &&
	  str
		.match(
		  /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
		)
		.join(' ');
	return s.slice(0, 1).toUpperCase() + s.slice(1);
  };

export const slugify = (value: string = "", upper: boolean = false) => {
	let tempSlug = camelToSnakeCase(value);
	tempSlug = tempSlug.replace(/\s/g, '-');
	if (upper) {
		tempSlug = tempSlug.toUpperCase();
	} else {
		tempSlug = tempSlug.toLowerCase();
	}
	// tempSlug = tempSlug.replace(/[%'?&*()+=<>#:\\`~!~@$^{}|;/\/"']/g, '');
	tempSlug = tempSlug.replace(/[^\w-]+/g, '').replace(/-+/g, '-');
	return tempSlug;
}

export const camelToSnakeCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

// export function toSentenceCase(str: string) {
// 	return str.toLowerCase().charAt(0).toUpperCase() + str.slice(1).toLowerCase();;
// }

export const generateOTP = (phone?: string): number => {
	return Number(Math.floor(100000 + Math.random() * 900000).toString());
}

export function getEnumKeyByValue<T>(__enum: T, value: string): string {
	const indexOfS = Object.values(__enum).indexOf(value);
	const key = Object.keys(__enum)[indexOfS];
	return key;
}

export const convertToStandardTimeFormat = (durationInSeconds: number) => {

	let hours = durationInSeconds / 3600;
	let mins = (durationInSeconds % 3600) / 60;
	let secs = (mins * 60) % 60;

	hours = Math.trunc(hours);
	mins = Math.trunc(mins);
	secs = Math.trunc(secs);

	if (!hours && !mins && !secs) {
		return "None";
	}

	if (hours) {
		if (mins) {
			return secs
				? `${hours} hr ${mins} min & ${secs} sec`
				: `${hours} hr & ${mins} min`;
		} else {
			return secs ? `${hours} hr & ${secs} sec` : `${hours} hr`;
		}
	} else {
		if (mins) {
			return secs ? `${mins} min & ${secs} sec` : `${mins} min`;
		} else {
			return secs ? `${secs} sec` : `1 sec`;
		}
	}

}

export function addDaysToCurrentDate(days: number) {
	var result = new Date();
	result.setDate(result.getDate() + days);
	return result;
}

export function addDaysToDate(date: string | Date, days: number) {
	if (!date) {
		return "No Date Provided";
	}
	let fromDate = new Date(date);
	fromDate.setDate(fromDate.getDate() + days);
	return fromDate;
}

const secretKey = "6LdwphIjAAAAAPuCaR7lCF7Gw5lZYvVvqnoI-Rcb";
export function validateRecaptcha(token: string, ip: string) {
	if (!token) {
		throw { message: "Recaptcha token not found", statusCode: 400 }
	}
	const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}&remoteip=${ip}`;
	return axios(verifyURL, {
		method: "POST",
	}).then((resp: any) => {
		let captchaValidation = resp?.data?.success;
		if (!captchaValidation) {
			throw { message: "Recaptcha verification failed, please try again", statusCode: 400 }
		}
		return true;
	}).catch((error) => {
		throw { message: "Recaptcha verification failed, please try again", statusCode: 400 }
	});
}

export function extractURLsFromString(message: string) {
	var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
	return message.match(urlRegex)
}

export function getMinutesDiff(date1: Date, date2: Date): number {
	const diffMilliseconds = Math.abs(date1.getTime() - date2.getTime());
	const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60));
	return diffMinutes;
}

export function getBusinessMinutesDiff(requestDate, replyDate) {
	let start = new Date(requestDate);
	let end = new Date(replyDate);
	var count = 0;

	for (var i = start.valueOf(); i < end.valueOf(); i = (start.setMinutes(start.getMinutes() + 1)).valueOf()) {
		if (start.getDay() != 0 && start.getDay() != 6 && start.getHours() >= 9 && start.getHours() < 18) {
			count++;
		}
	}
	return count;
}

export function getDifferenceInDays(startDate: string | Date, endDate: string | Date): number {
	const startDateObj = new Date(startDate);
	const endDateObj = new Date(endDate);
	const timeDifference = endDateObj.getTime() - startDateObj.getTime();
	const differenceInDays = timeDifference / (24 * 60 * 60 * 1000);
	return Math.round(differenceInDays);
}

let months = [
	["Jan", "January"],
	["Feb", "February"],
	["Mar", "March"],
	["Apr", "April"],
	["May", "May"],
	["Jun", "June"],
	["Jul", "July"],
	["Aug", "August"],
	["Sep", "September"],
	["Oct", "October"],
	["Nov", "November"],
	["Dec", "December"],
];

export function convertDate(
	dt: string | number | Date,
	format:
		| "dd/mm/yy"
		| "dd-mm-yy"
		| "dd mm yy"
		| "dd M yy"
		| "dd M,yy"
		| "dd MM,yy"
		| "dd MM yy"
		| "M dd,yy"
		| "MM dd,yy"
		| "M dd yy"
		| "MM dd yy"
		| "dd M,yy-t"
		| "MM yy"
		| "yy-mm-dd" = 'dd M yy'
) {
	if (dt) {
		var date = new Date(dt);
		let day = date.getDate();
		let dayWith0 = day > 9 ? day : "0" + String(day);
		let month = date.getMonth();
		let monthWith0 = month + 1 > 9 ? month + 1 : "0" + String(month + 1);
		let year = date.getFullYear();
		let hours = date.getHours();
		let minutes = date.getMinutes();
		let min = minutes > 9 ? minutes : "0" + String(minutes);
		let monthNameShort = months[month][0];
		let monthNameLong = months[month][1];
		switch (format) {
			case "dd/mm/yy":
				return `${dayWith0}/${monthWith0}/${year}`;
			case "dd-mm-yy":
				return `${dayWith0}-${monthWith0}-${year}`;
			case "yy-mm-dd":
				return `${year}-${monthWith0}-${dayWith0}`;
			case "dd mm yy":
				return `${dayWith0} ${monthWith0} ${year}`;
			case "dd M yy":
				return `${dayWith0} ${monthNameShort} ${year}`;
			case "dd M,yy":
				return `${dayWith0} ${monthNameShort}, ${year}`;
			case "dd MM,yy":
				return `${dayWith0} ${monthNameLong}, ${year}`;
			case "dd MM yy":
				return `${dayWith0} ${monthNameLong} ${year}`;
			case "M dd,yy":
				return ` ${monthNameShort} ${dayWith0}, ${year}`;
			case "MM dd,yy":
				return `${monthNameLong} ${dayWith0}, ${year}`;
			case "M dd yy":
				return ` ${monthNameShort} ${dayWith0} ${year}`;
			case "MM dd yy":
				return `${monthNameLong} ${dayWith0} ${year}`;
			case "MM yy": 
				return `${monthNameLong} ${year}`;
			case "dd M,yy-t":
				return `${dayWith0} ${monthNameShort}, ${year} - ${hours > 12 ? `${hours - 12}:${min} pm` : `${hours}:${min} am`
					}`;
			default:
				break;
		}
	}
}

export function isSameDay(date1: Date, date2: Date) {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

export function isSameMonthYear(date1: Date, date2: Date) {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth()
	);
}

export function isWeekend(date: Date) {
	const dayOfWeek = date.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
	// return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
	return dayOfWeek === 0 || dayOfWeek === 6; // Sunday
}

export function calculateTotalHours(startDate: Date, endDate: Date): number {
	const timeDifference = endDate.getTime() - startDate.getTime();
	const hours = timeDifference / (1000 * 60 * 60); // Convert milliseconds to hours
	return parseFloat(hours.toFixed(2)); // Convert the string to a number with two decimal places
}

export function getDayRange(date: Date) {
    const currentDate = new Date(date);

    // Calculate day start
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);

    // Calculate day end
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    return {
      dayStart,
      dayEnd,
    };
  }

export function isDateInRange(givenDate : Date, fromDate: Date, toDate: Date) {
	givenDate = new Date(givenDate);
	givenDate.setHours(0, 0, 0, 0);

	fromDate = new Date(fromDate);
	fromDate.setHours(0, 0, 0, 0);
	
	toDate = new Date(toDate);
	toDate.setHours(0, 0, 0, 0);

	return givenDate >= fromDate && givenDate <= toDate;
}

export function generateRandomName(length: number = 20) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let randomName = '';
  
	for (let i = 0; i < length; i++) {
	  const randomIndex = Math.floor(Math.random() * charset.length);
	  randomName += charset.charAt(randomIndex);
	}
  
	return randomName;
  }

  /**
   * 
   * @param duration in miliseconds; 1000 = 1s
   */
  export async function sleep(duration : number = 2000){
	await new Promise(resolve => setTimeout(resolve, duration));
  }

  export function extractIds(text: string){
	const regex = /\d+/g;
	const extractedIds = text.match(regex);
	let allIds: number[] = [];
	if (extractedIds) {
		extractedIds.forEach((ele) => {
			allIds.push(Number(ele));
		})
	  }
	return allIds
  }

  export function getTaxData(lineItems: Array<QuotationMilestone & {TaxRate: Partial<TaxRate>}> | Array<InvoiceItem & {TaxRate: Partial<TaxRate>}>){
	let taxData = new Map<number, {rate: number, title: string, totalTax: number}>();
	lineItems.forEach((ele) =>{
		if(ele.taxRateId){
		let totalTax = taxData.get(ele.taxRateId) ? taxData.get(ele.taxRateId).totalTax : 0;
		totalTax += ele.taxAmount;
		taxData.set(ele.taxRateId, {title: ele.TaxRate.title, rate: ele.TaxRate.rate, totalTax: totalTax})
		}
	})
	return Array.from(taxData);
  }
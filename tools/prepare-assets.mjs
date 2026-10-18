#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as topojson from 'topojson-client';
import { optimize } from 'svgo';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');

// 193 UN Member States with ISO 3166-1 alpha-2, numeric code, continent, coordinates, difficulty tier
export const UN_MEMBERS = [
  { code: 'AF', num: '004', name: 'Afghanistan', continent: 'asia', lat: 33.94, lng: 67.71, tier: 2 },
  { code: 'AL', num: '008', name: 'Albania', continent: 'europe', lat: 41.15, lng: 20.17, tier: 2 },
  { code: 'DZ', num: '012', name: 'Algeria', continent: 'africa', lat: 28.03, lng: 1.66, tier: 2 },
  { code: 'AD', num: '020', name: 'Andorra', continent: 'europe', lat: 42.51, lng: 1.52, tier: 3, micro: true },
  { code: 'AO', num: '024', name: 'Angola', continent: 'africa', lat: -11.2, lng: 17.87, tier: 2 },
  { code: 'AG', num: '028', name: 'Antigua and Barbuda', continent: 'americas', lat: 17.06, lng: -61.8, tier: 3, micro: true },
  { code: 'AR', num: '032', name: 'Argentina', continent: 'americas', lat: -38.42, lng: -63.62, tier: 1 },
  { code: 'AM', num: '051', name: 'Armenia', continent: 'asia', lat: 40.07, lng: 45.04, tier: 2 },
  { code: 'AU', num: '036', name: 'Australia', continent: 'oceania', lat: -25.27, lng: 133.78, tier: 1 },
  { code: 'AT', num: '040', name: 'Austria', continent: 'europe', lat: 47.52, lng: 14.55, tier: 1 },
  { code: 'AZ', num: '031', name: 'Azerbaijan', continent: 'asia', lat: 40.14, lng: 47.58, tier: 2 },
  { code: 'BS', num: '044', name: 'Bahamas', continent: 'americas', lat: 25.03, lng: -77.4, tier: 2, micro: true },
  { code: 'BH', num: '048', name: 'Bahrain', continent: 'asia', lat: 26.07, lng: 50.56, tier: 3, micro: true },
  { code: 'BD', num: '050', name: 'Bangladesh', continent: 'asia', lat: 23.69, lng: 90.36, tier: 2 },
  { code: 'BB', num: '052', name: 'Barbados', continent: 'americas', lat: 13.19, lng: -59.54, tier: 3, micro: true },
  { code: 'BY', num: '112', name: 'Belarus', continent: 'europe', lat: 53.71, lng: 27.95, tier: 2 },
  { code: 'BE', num: '056', name: 'Belgium', continent: 'europe', lat: 50.5, lng: 4.47, tier: 1 },
  { code: 'BZ', num: '084', name: 'Belize', continent: 'americas', lat: 17.19, lng: -88.5, tier: 2 },
  { code: 'BJ', num: '204', name: 'Benin', continent: 'africa', lat: 9.31, lng: 2.32, tier: 3 },
  { code: 'BT', num: '064', name: 'Bhutan', continent: 'asia', lat: 27.51, lng: 90.43, tier: 3 },
  { code: 'BO', num: '068', name: 'Bolivia', continent: 'americas', lat: -16.29, lng: -63.59, tier: 2 },
  { code: 'BA', num: '070', name: 'Bosnia and Herzegovina', continent: 'europe', lat: 43.92, lng: 17.68, tier: 2 },
  { code: 'BW', num: '072', name: 'Botswana', continent: 'africa', lat: -22.33, lng: 24.68, tier: 2 },
  { code: 'BR', num: '076', name: 'Brazil', continent: 'americas', lat: -14.24, lng: -51.93, tier: 1 },
  { code: 'BN', num: '096', name: 'Brunei', continent: 'asia', lat: 4.54, lng: 114.73, tier: 3, micro: true },
  { code: 'BG', num: '100', name: 'Bulgaria', continent: 'europe', lat: 42.73, lng: 25.49, tier: 2 },
  { code: 'BF', num: '854', name: 'Burkina Faso', continent: 'africa', lat: 12.24, lng: -1.56, tier: 3 },
  { code: 'BI', num: '108', name: 'Burundi', continent: 'africa', lat: -3.37, lng: 29.92, tier: 3 },
  { code: 'CV', num: '132', name: 'Cabo Verde', continent: 'africa', lat: 16.54, lng: -23.04, tier: 3, micro: true },
  { code: 'KH', num: '116', name: 'Cambodia', continent: 'asia', lat: 12.57, lng: 104.99, tier: 2 },
  { code: 'CM', num: '120', name: 'Cameroon', continent: 'africa', lat: 7.37, lng: 12.35, tier: 2 },
  { code: 'CA', num: '124', name: 'Canada', continent: 'americas', lat: 56.13, lng: -106.35, tier: 1 },
  { code: 'CF', num: '140', name: 'Central African Republic', continent: 'africa', lat: 6.61, lng: 20.94, tier: 3 },
  { code: 'TD', num: '148', name: 'Chad', continent: 'africa', lat: 15.45, lng: 18.73, tier: 2 },
  { code: 'CL', num: '152', name: 'Chile', continent: 'americas', lat: -35.68, lng: -71.54, tier: 1 },
  { code: 'CN', num: '156', name: 'China', continent: 'asia', lat: 35.86, lng: 104.2, tier: 1 },
  { code: 'CO', num: '170', name: 'Colombia', continent: 'americas', lat: 4.57, lng: -74.3, tier: 1 },
  { code: 'KM', num: '174', name: 'Comoros', continent: 'africa', lat: -11.88, lng: 43.87, tier: 3, micro: true },
  { code: 'CG', num: '178', name: 'Congo', continent: 'africa', lat: -0.23, lng: 15.83, tier: 3 },
  { code: 'CD', num: '180', name: 'Democratic Republic of the Congo', continent: 'africa', lat: -4.04, lng: 21.76, tier: 2 },
  { code: 'CR', num: '188', name: 'Costa Rica', continent: 'americas', lat: 9.75, lng: -83.75, tier: 2 },
  { code: 'CI', num: '384', name: "Côte d'Ivoire", continent: 'africa', lat: 7.54, lng: -5.55, tier: 2 },
  { code: 'HR', num: '191', name: 'Croatia', continent: 'europe', lat: 45.1, lng: 15.2, tier: 2 },
  { code: 'CU', num: '192', name: 'Cuba', continent: 'americas', lat: 21.52, lng: -77.78, tier: 1 },
  { code: 'CY', num: '196', name: 'Cyprus', continent: 'europe', lat: 35.13, lng: 33.43, tier: 2 },
  { code: 'CZ', num: '203', name: 'Czech Republic', continent: 'europe', lat: 49.82, lng: 15.47, tier: 2 },
  { code: 'DK', num: '208', name: 'Denmark', continent: 'europe', lat: 56.26, lng: 9.5, tier: 1 },
  { code: 'DJ', num: '262', name: 'Djibouti', continent: 'africa', lat: 11.83, lng: 42.59, tier: 3 },
  { code: 'DM', num: '212', name: 'Dominica', continent: 'americas', lat: 15.42, lng: -61.37, tier: 3, micro: true },
  { code: 'DO', num: '214', name: 'Dominican Republic', continent: 'americas', lat: 18.74, lng: -70.16, tier: 2 },
  { code: 'EC', num: '218', name: 'Ecuador', continent: 'americas', lat: -1.83, lng: -78.18, tier: 2 },
  { code: 'EG', num: '818', name: 'Egypt', continent: 'africa', lat: 26.82, lng: 30.8, tier: 1 },
  { code: 'SV', num: '222', name: 'El Salvador', continent: 'americas', lat: 13.79, lng: -88.9, tier: 2 },
  { code: 'GQ', num: '226', name: 'Equatorial Guinea', continent: 'africa', lat: 1.65, lng: 10.27, tier: 3 },
  { code: 'ER', num: '232', name: 'Eritrea', continent: 'africa', lat: 15.18, lng: 39.78, tier: 3 },
  { code: 'EE', num: '233', name: 'Estonia', continent: 'europe', lat: 58.6, lng: 25.01, tier: 2 },
  { code: 'SZ', num: '748', name: 'Eswatini', continent: 'africa', lat: -26.52, lng: 31.47, tier: 3 },
  { code: 'ET', num: '231', name: 'Ethiopia', continent: 'africa', lat: 9.15, lng: 40.49, tier: 2 },
  { code: 'FJ', num: '242', name: 'Fiji', continent: 'oceania', lat: -17.71, lng: 178.07, tier: 2 },
  { code: 'FI', num: '246', name: 'Finland', continent: 'europe', lat: 61.92, lng: 25.75, tier: 1 },
  { code: 'FR', num: '250', name: 'France', continent: 'europe', lat: 46.23, lng: 2.21, tier: 1 },
  { code: 'GA', num: '266', name: 'Gabon', continent: 'africa', lat: -0.8, lng: 11.61, tier: 3 },
  { code: 'GM', num: '270', name: 'Gambia', continent: 'africa', lat: 13.44, lng: -15.31, tier: 3 },
  { code: 'GE', num: '268', name: 'Georgia', continent: 'asia', lat: 42.32, lng: 43.36, tier: 2 },
  { code: 'DE', num: '276', name: 'Germany', continent: 'europe', lat: 51.17, lng: 10.45, tier: 1 },
  { code: 'GH', num: '288', name: 'Ghana', continent: 'africa', lat: 7.95, lng: -1.02, tier: 2 },
  { code: 'GR', num: '300', name: 'Greece', continent: 'europe', lat: 39.07, lng: 21.82, tier: 1 },
  { code: 'GD', num: '308', name: 'Grenada', continent: 'americas', lat: 12.12, lng: -61.68, tier: 3, micro: true },
  { code: 'GT', num: '320', name: 'Guatemala', continent: 'americas', lat: 15.78, lng: -90.23, tier: 2 },
  { code: 'GN', num: '324', name: 'Guinea', continent: 'africa', lat: 9.95, lng: -9.7, tier: 3 },
  { code: 'GW', num: '624', name: 'Guinea-Bissau', continent: 'africa', lat: 11.8, lng: -15.18, tier: 3 },
  { code: 'GY', num: '328', name: 'Guyana', continent: 'americas', lat: 4.86, lng: -58.93, tier: 3 },
  { code: 'HT', num: '332', name: 'Haiti', continent: 'americas', lat: 18.97, lng: -72.29, tier: 2 },
  { code: 'HN', num: '340', name: 'Honduras', continent: 'americas', lat: 15.2, lng: -86.24, tier: 2 },
  { code: 'HU', num: '348', name: 'Hungary', continent: 'europe', lat: 47.16, lng: 19.5, tier: 2 },
  { code: 'IS', num: '352', name: 'Iceland', continent: 'europe', lat: 64.96, lng: -19.02, tier: 1 },
  { code: 'IN', num: '356', name: 'India', continent: 'asia', lat: 20.59, lng: 78.96, tier: 1 },
  { code: 'ID', num: '360', name: 'Indonesia', continent: 'asia', lat: -0.79, lng: 113.92, tier: 1 },
  { code: 'IQ', num: '368', name: 'Iraq', continent: 'asia', lat: 33.22, lng: 43.68, tier: 2 },
  { code: 'IE', num: '372', name: 'Ireland', continent: 'europe', lat: 53.14, lng: -7.69, tier: 1 },
  { code: 'IT', num: '380', name: 'Italy', continent: 'europe', lat: 41.87, lng: 12.57, tier: 1 },
  { code: 'JM', num: '388', name: 'Jamaica', continent: 'americas', lat: 18.11, lng: -77.3, tier: 1 },
  { code: 'JP', num: '392', name: 'Japan', continent: 'asia', lat: 36.2, lng: 138.25, tier: 1 },
  { code: 'JO', num: '400', name: 'Jordan', continent: 'asia', lat: 30.59, lng: 36.24, tier: 2 },
  { code: 'KZ', num: '398', name: 'Kazakhstan', continent: 'asia', lat: 48.02, lng: 66.92, tier: 2 },
  { code: 'KE', num: '404', name: 'Kenya', continent: 'africa', lat: -0.02, lng: 37.91, tier: 2 },
  { code: 'KI', num: '296', name: 'Kiribati', continent: 'oceania', lat: 1.45, lng: 172.97, tier: 3, micro: true },
  { code: 'KW', num: '414', name: 'Kuwait', continent: 'asia', lat: 29.31, lng: 47.48, tier: 2 },
  { code: 'KG', num: '417', name: 'Kyrgyzstan', continent: 'asia', lat: 41.2, lng: 74.77, tier: 3 },
  { code: 'LA', num: '418', name: 'Laos', continent: 'asia', lat: 19.86, lng: 102.5, tier: 2 },
  { code: 'LV', num: '428', name: 'Latvia', continent: 'europe', lat: 56.88, lng: 24.6, tier: 2 },
  { code: 'LB', num: '422', name: 'Lebanon', continent: 'asia', lat: 33.85, lng: 35.86, tier: 2 },
  { code: 'LS', num: '426', name: 'Lesotho', continent: 'africa', lat: -29.61, lng: 28.23, tier: 3 },
  { code: 'LR', num: '430', name: 'Liberia', continent: 'africa', lat: 6.43, lng: -9.43, tier: 3 },
  { code: 'LY', num: '434', name: 'Libya', continent: 'africa', lat: 26.34, lng: 17.23, tier: 2 },
  { code: 'LI', num: '438', name: 'Liechtenstein', continent: 'europe', lat: 47.17, lng: 9.56, tier: 3, micro: true },
  { code: 'LT', num: '440', name: 'Lithuania', continent: 'europe', lat: 55.17, lng: 23.88, tier: 2 },
  { code: 'LU', num: '442', name: 'Luxembourg', continent: 'europe', lat: 49.82, lng: 6.13, tier: 2 },
  { code: 'MG', num: '450', name: 'Madagascar', continent: 'africa', lat: -18.77, lng: 46.87, tier: 2 },
  { code: 'MW', num: '454', name: 'Malawi', continent: 'africa', lat: -13.25, lng: 34.3, tier: 3 },
  { code: 'MY', num: '458', name: 'Malaysia', continent: 'asia', lat: 4.21, lng: 101.98, tier: 2 },
  { code: 'MV', num: '462', name: 'Maldives', continent: 'asia', lat: 3.2, lng: 73.22, tier: 3, micro: true },
  { code: 'ML', num: '466', name: 'Mali', continent: 'africa', lat: 17.57, lng: -4.0, tier: 3 },
  { code: 'MT', num: '470', name: 'Malta', continent: 'europe', lat: 35.94, lng: 14.38, tier: 3, micro: true },
  { code: 'MH', num: '584', name: 'Marshall Islands', continent: 'oceania', lat: 7.13, lng: 171.18, tier: 3, micro: true },
  { code: 'MR', num: '478', name: 'Mauritania', continent: 'africa', lat: 21.01, lng: -10.94, tier: 3 },
  { code: 'MU', num: '480', name: 'Mauritius', continent: 'africa', lat: -20.35, lng: 57.55, tier: 3, micro: true },
  { code: 'MX', num: '484', name: 'Mexico', continent: 'americas', lat: 23.63, lng: -102.55, tier: 1 },
  { code: 'FM', num: '583', name: 'Micronesia', continent: 'oceania', lat: 7.43, lng: 150.55, tier: 3, micro: true },
  { code: 'MD', num: '498', name: 'Moldova', continent: 'europe', lat: 47.41, lng: 28.37, tier: 3 },
  { code: 'MC', num: '492', name: 'Monaco', continent: 'europe', lat: 43.74, lng: 7.42, tier: 3, micro: true },
  { code: 'MN', num: '496', name: 'Mongolia', continent: 'asia', lat: 46.86, lng: 103.85, tier: 2 },
  { code: 'ME', num: '499', name: 'Montenegro', continent: 'europe', lat: 42.71, lng: 19.37, tier: 3 },
  { code: 'MA', num: '504', name: 'Morocco', continent: 'africa', lat: 31.79, lng: -7.09, tier: 1 },
  { code: 'MZ', num: '508', name: 'Mozambique', continent: 'africa', lat: -18.67, lng: 35.53, tier: 3 },
  { code: 'MM', num: '104', name: 'Myanmar', continent: 'asia', lat: 21.92, lng: 95.96, tier: 2 },
  { code: 'NA', num: '516', name: 'Namibia', continent: 'africa', lat: -22.96, lng: 18.49, tier: 2 },
  { code: 'NR', num: '520', name: 'Nauru', continent: 'oceania', lat: -0.52, lng: 166.93, tier: 3, micro: true },
  { code: 'NP', num: '524', name: 'Nepal', continent: 'asia', lat: 28.39, lng: 84.12, tier: 2 },
  { code: 'NL', num: '528', name: 'Netherlands', continent: 'europe', lat: 52.13, lng: 5.29, tier: 1 },
  { code: 'NZ', num: '554', name: 'New Zealand', continent: 'oceania', lat: -40.9, lng: 174.89, tier: 1 },
  { code: 'NI', num: '558', name: 'Nicaragua', continent: 'americas', lat: 12.87, lng: -85.21, tier: 2 },
  { code: 'NE', num: '562', name: 'Niger', continent: 'africa', lat: 17.61, lng: 8.08, tier: 3 },
  { code: 'NG', num: '566', name: 'Nigeria', continent: 'africa', lat: 9.08, lng: 8.68, tier: 1 },
  { code: 'KP', num: '408', name: 'North Korea', continent: 'asia', lat: 40.34, lng: 127.51, tier: 2 },
  { code: 'MK', num: '807', name: 'North Macedonia', continent: 'europe', lat: 41.61, lng: 21.75, tier: 3 },
  { code: 'NO', num: '578', name: 'Norway', continent: 'europe', lat: 60.47, lng: 8.47, tier: 1 },
  { code: 'OM', num: '512', name: 'Oman', continent: 'asia', lat: 21.51, lng: 55.92, tier: 2 },
  { code: 'PK', num: '586', name: 'Pakistan', continent: 'asia', lat: 30.38, lng: 69.35, tier: 2 },
  { code: 'PW', num: '585', name: 'Palau', continent: 'oceania', lat: 7.52, lng: 134.58, tier: 3, micro: true },
  { code: 'PA', num: '591', name: 'Panama', continent: 'americas', lat: 8.54, lng: -80.78, tier: 2 },
  { code: 'PG', num: '598', name: 'Papua New Guinea', continent: 'oceania', lat: -6.32, lng: 143.96, tier: 3 },
  { code: 'PY', num: '600', name: 'Paraguay', continent: 'americas', lat: -23.44, lng: -58.44, tier: 2 },
  { code: 'PE', num: '604', name: 'Peru', continent: 'americas', lat: -9.19, lng: -75.02, tier: 1 },
  { code: 'PH', num: '608', name: 'Philippines', continent: 'asia', lat: 12.88, lng: 121.77, tier: 1 },
  { code: 'PL', num: '616', name: 'Poland', continent: 'europe', lat: 51.92, lng: 19.15, tier: 1 },
  { code: 'PT', num: '620', name: 'Portugal', continent: 'europe', lat: 39.4, lng: -8.22, tier: 1 },
  { code: 'QA', num: '634', name: 'Qatar', continent: 'asia', lat: 25.35, lng: 51.18, tier: 2, micro: true },
  { code: 'RO', num: '642', name: 'Romania', continent: 'europe', lat: 45.94, lng: 24.97, tier: 2 },
  { code: 'RU', num: '643', name: 'Russia', continent: 'europe', lat: 61.52, lng: 105.32, tier: 1 },
  { code: 'RW', num: '646', name: 'Rwanda', continent: 'africa', lat: -1.94, lng: 29.87, tier: 3 },
  { code: 'KN', num: '659', name: 'Saint Kitts and Nevis', continent: 'americas', lat: 17.36, lng: -62.78, tier: 3, micro: true },
  { code: 'LC', num: '662', name: 'Saint Lucia', continent: 'americas', lat: 13.91, lng: -60.98, tier: 3, micro: true },
  { code: 'VC', num: '670', name: 'Saint Vincent and the Grenadines', continent: 'americas', lat: 12.98, lng: -61.29, tier: 3, micro: true },
  { code: 'WS', num: '882', name: 'Samoa', continent: 'oceania', lat: -13.76, lng: -172.1, tier: 3, micro: true },
  { code: 'SM', num: '674', name: 'San Marino', continent: 'europe', lat: 43.94, lng: 12.46, tier: 3, micro: true },
  { code: 'ST', num: '678', name: 'Sao Tome and Principe', continent: 'africa', lat: 0.19, lng: 6.61, tier: 3, micro: true },
  { code: 'SA', num: '682', name: 'Saudi Arabia', continent: 'asia', lat: 23.89, lng: 45.08, tier: 1 },
  { code: 'SN', num: '686', name: 'Senegal', continent: 'africa', lat: 14.5, lng: -14.45, tier: 2 },
  { code: 'RS', num: '688', name: 'Serbia', continent: 'europe', lat: 44.02, lng: 21.01, tier: 2 },
  { code: 'SC', num: '690', name: 'Seychelles', continent: 'africa', lat: -4.68, lng: 55.49, tier: 3, micro: true },
  { code: 'SL', num: '694', name: 'Sierra Leone', continent: 'africa', lat: 8.46, lng: -11.78, tier: 3 },
  { code: 'SG', num: '702', name: 'Singapore', continent: 'asia', lat: 1.35, lng: 103.82, tier: 2, micro: true },
  { code: 'SK', num: '703', name: 'Slovakia', continent: 'europe', lat: 48.67, lng: 19.7, tier: 2 },
  { code: 'SI', num: '705', name: 'Slovenia', continent: 'europe', lat: 46.15, lng: 15.0, tier: 2 },
  { code: 'SB', num: '090', name: 'Solomon Islands', continent: 'oceania', lat: -9.65, lng: 160.16, tier: 3 },
  { code: 'SO', num: '706', name: 'Somalia', continent: 'africa', lat: 5.15, lng: 46.2, tier: 2 },
  { code: 'ZA', num: '710', name: 'South Africa', continent: 'africa', lat: -30.56, lng: 22.94, tier: 1 },
  { code: 'KR', num: '410', name: 'South Korea', continent: 'asia', lat: 35.91, lng: 127.77, tier: 1 },
  { code: 'SS', num: '728', name: 'South Sudan', continent: 'africa', lat: 6.88, lng: 31.31, tier: 3 },
  { code: 'ES', num: '724', name: 'Spain', continent: 'europe', lat: 40.46, lng: -3.75, tier: 1 },
  { code: 'LK', num: '144', name: 'Sri Lanka', continent: 'asia', lat: 7.87, lng: 80.77, tier: 2 },
  { code: 'SD', num: '729', name: 'Sudan', continent: 'africa', lat: 12.86, lng: 30.22, tier: 2 },
  { code: 'SR', num: '740', name: 'Suriname', continent: 'americas', lat: 3.92, lng: -56.03, tier: 3 },
  { code: 'SE', num: '752', name: 'Sweden', continent: 'europe', lat: 60.13, lng: 18.64, tier: 1 },
  { code: 'CH', num: '756', name: 'Switzerland', continent: 'europe', lat: 46.82, lng: 8.23, tier: 1 },
  { code: 'TJ', num: '762', name: 'Tajikistan', continent: 'asia', lat: 38.86, lng: 71.28, tier: 3 },
  { code: 'TZ', num: '834', name: 'Tanzania', continent: 'africa', lat: -6.37, lng: 34.89, tier: 2 },
  { code: 'TH', num: '764', name: 'Thailand', continent: 'asia', lat: 15.87, lng: 100.99, tier: 1 },
  { code: 'TL', num: '626', name: 'Timor-Leste', continent: 'asia', lat: -8.87, lng: 125.73, tier: 3 },
  { code: 'TG', num: '768', name: 'Togo', continent: 'africa', lat: 8.62, lng: 0.82, tier: 3 },
  { code: 'TO', num: '776', name: 'Tonga', continent: 'oceania', lat: -21.18, lng: -175.2, tier: 3, micro: true },
  { code: 'TT', num: '780', name: 'Trinidad and Tobago', continent: 'americas', lat: 10.69, lng: -61.22, tier: 3, micro: true },
  { code: 'TN', num: '788', name: 'Tunisia', continent: 'africa', lat: 33.89, lng: 9.54, tier: 2 },
  { code: 'TR', num: '792', name: 'Turkey', continent: 'asia', lat: 38.96, lng: 35.24, tier: 1 },
  { code: 'TM', num: '795', name: 'Turkmenistan', continent: 'asia', lat: 38.97, lng: 59.56, tier: 3 },
  { code: 'TV', num: '798', name: 'Tuvalu', continent: 'oceania', lat: -7.11, lng: 177.65, tier: 3, micro: true },
  { code: 'UG', num: '800', name: 'Uganda', continent: 'africa', lat: 1.37, lng: 32.29, tier: 2 },
  { code: 'UA', num: '804', name: 'Ukraine', continent: 'europe', lat: 48.38, lng: 31.17, tier: 1 },
  { code: 'AE', num: '784', name: 'United Arab Emirates', continent: 'asia', lat: 23.42, lng: 53.85, tier: 1 },
  { code: 'GB', num: '826', name: 'United Kingdom', continent: 'europe', lat: 55.38, lng: -3.44, tier: 1 },
  { code: 'US', num: '840', name: 'United States', continent: 'americas', lat: 37.09, lng: -95.71, tier: 1 },
  { code: 'UY', num: '858', name: 'Uruguay', continent: 'americas', lat: -32.52, lng: -55.77, tier: 2 },
  { code: 'UZ', num: '860', name: 'Uzbekistan', continent: 'asia', lat: 41.38, lng: 64.59, tier: 2 },
  { code: 'VU', num: '548', name: 'Vanuatu', continent: 'oceania', lat: -15.38, lng: 166.96, tier: 3 },
  { code: 'VE', num: '862', name: 'Venezuela', continent: 'americas', lat: 6.42, lng: -66.59, tier: 2 },
  { code: 'VN', num: '704', name: 'Vietnam', continent: 'asia', lat: 14.06, lng: 108.28, tier: 1 },
  { code: 'YE', num: '887', name: 'Yemen', continent: 'asia', lat: 15.55, lng: 48.52, tier: 2 },
  { code: 'ZM', num: '894', name: 'Zambia', continent: 'africa', lat: -13.13, lng: 27.85, tier: 3 },
  { code: 'ZW', num: '716', name: 'Zimbabwe', continent: 'africa', lat: -19.02, lng: 29.15, tier: 2 }
];

console.log(`Verified ${UN_MEMBERS.length} UN Member States.`);

// Numeric lookup map (padding both with leading zero and without)
const numToUN = new Map();
for (const m of UN_MEMBERS) {
  numToUN.set(m.num, m);
  numToUN.set(String(parseInt(m.num, 10)), m);
}

// Helpers
function roundCoordinates(coords) {
  if (typeof coords[0] === 'number') {
    return [Math.round(coords[0] * 100) / 100, Math.round(coords[1] * 100) / 100];
  }
  return coords.map(roundCoordinates);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper to split a polygon ring that crosses the antimeridian (jumps across +/- 180 lon)
function splitAntimeridianRing(ring) {
  const jumps = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const dLng = Math.abs(ring[i + 1][0] - ring[i][0]);
    if (dLng > 180) {
      jumps.push(i);
    }
  }

  if (jumps.length === 0) return [ring];

  // If ring enters Western hemisphere and leaves it back to Eastern
  if (jumps.length === 2) {
    const idx1 = jumps[0];
    const idx2 = jumps[1];
    const p1 = ring[idx1];
    const p2 = ring[idx1 + 1];
    const p3 = ring[idx2];
    const p4 = ring[idx2 + 1];

    const latCross1 = (p1[1] + p2[1]) / 2;
    const latCross2 = (p3[1] + p4[1]) / 2;

    const eastRing = [
      ...ring.slice(0, idx1 + 1),
      [180, Math.round(latCross1 * 100) / 100],
      [180, Math.round(latCross2 * 100) / 100],
      ...ring.slice(idx2 + 1)
    ];

    const westRing = [
      [-180, Math.round(latCross1 * 100) / 100],
      ...ring.slice(idx1 + 1, idx2 + 1),
      [-180, Math.round(latCross2 * 100) / 100],
      [-180, Math.round(latCross1 * 100) / 100]
    ];

    return [eastRing, westRing];
  }

  return [ring];
}

function normalizeRingHemispheres(ring) {
  let posCount = 0;
  let negCount = 0;
  ring.forEach((pt) => {
    if (pt[0] > 0 && pt[0] < 180) posCount++;
    else if (pt[0] < 0 && pt[0] > -180) negCount++;
  });

  if (posCount > 0 && negCount === 0) {
    // Purely Eastern ring: any -180 should be 180
    ring.forEach((pt) => {
      if (pt[0] === -180) pt[0] = 180;
    });
  } else if (negCount > 0 && posCount === 0) {
    // Purely Western ring: any 180 should be -180
    ring.forEach((pt) => {
      if (pt[0] === 180) pt[0] = -180;
    });
  }
}

// 1. Process World GeoJSON
console.log('\n--- 1. Processing Map Data ---');
const worldAtlasPath = path.join(__dirname, 'node_modules', 'world-atlas', 'countries-110m.json');
if (!fs.existsSync(worldAtlasPath)) {
  console.error(`Error: ${worldAtlasPath} not found. Run "npm install" in tools/ first.`);
  process.exit(1);
}

const worldAtlas = JSON.parse(fs.readFileSync(worldAtlasPath, 'utf8'));
const geo = topojson.feature(worldAtlas, worldAtlas.objects.countries);

// Filter out Antarctica (-60 lat and non-UN) to prevent pole stretching
geo.features = geo.features.filter((f) => String(f.id) !== '010' && String(f.id) !== '10');

const mappedCount = { un: 0, neutral: 0 };
geo.features.forEach((feature) => {
  feature.geometry.coordinates = roundCoordinates(feature.geometry.coordinates);

  // Split and normalize antimeridian crossing rings
  if (feature.geometry.type === 'MultiPolygon') {
    const newCoords = [];
    feature.geometry.coordinates.forEach((poly) => {
      const ring = poly[0];
      const splits = splitAntimeridianRing(ring);
      splits.forEach((r) => {
        normalizeRingHemispheres(r);
        newCoords.push([r]);
      });
    });
    feature.geometry.coordinates = newCoords;
  } else if (feature.geometry.type === 'Polygon') {
    const ring = feature.geometry.coordinates[0];
    const splits = splitAntimeridianRing(ring);
    if (splits.length > 1) {
      feature.geometry.type = 'MultiPolygon';
      feature.geometry.coordinates = splits.map((r) => {
        normalizeRingHemispheres(r);
        return [r];
      });
    } else {
      normalizeRingHemispheres(ring);
    }
  }

  const unMatch = numToUN.get(String(feature.id));
  if (unMatch) {
    feature.id = unMatch.code;
    feature.properties = {
      code: unMatch.code,
      name: unMatch.name,
      continent: unMatch.continent,
      isUN: true
    };
    mappedCount.un++;
  } else {
    feature.id = `non-un-${feature.id}`;
    feature.properties = {
      isUN: false
    };
    mappedCount.neutral++;
  }
});

ensureDir(path.join(assetsDir, 'data'));
const worldGeoJsonPath = path.join(assetsDir, 'data', 'world.json');
const worldGeoJsonStr = JSON.stringify(geo);
fs.writeFileSync(worldGeoJsonPath, worldGeoJsonStr, 'utf8');
console.log(`Saved world.json (${Math.round(worldGeoJsonStr.length / 1024)} KB) -> UN features: ${mappedCount.un}, Neutral: ${mappedCount.neutral}`);

// Also save standalone countries.json
const countriesJsonPath = path.join(assetsDir, 'data', 'countries.json');
fs.writeFileSync(countriesJsonPath, JSON.stringify(UN_MEMBERS, null, 2), 'utf8');
console.log(`Saved countries.json (${UN_MEMBERS.length} countries)`);

// 2. Process Flags
console.log('\n--- 2. Processing 193 UN Country Flags (SVGO Optimization) ---');
const flagIconsDir = path.join(__dirname, 'node_modules', 'flag-icons', 'flags', '4x3');
const destFlagsDir = path.join(assetsDir, 'flags');
ensureDir(destFlagsDir);

let totalFlagBytesBefore = 0;
let totalFlagBytesAfter = 0;
let missingFlags = 0;

for (const country of UN_MEMBERS) {
  const codeLower = country.code.toLowerCase();
  const srcFile = path.join(flagIconsDir, `${codeLower}.svg`);
  const destFile = path.join(destFlagsDir, `${codeLower}.svg`);

  if (!fs.existsSync(srcFile)) {
    console.warn(`Warning: Missing flag for ${country.code} at ${srcFile}`);
    missingFlags++;
    continue;
  }

  const rawSvg = fs.readFileSync(srcFile, 'utf8');
  totalFlagBytesBefore += rawSvg.length;

  const optimized = optimize(rawSvg, {
    multipass: true,
    plugins: [
      'removeDoctype',
      'removeXMLProcInst',
      'removeComments',
      'removeMetadata',
      'removeEditorsNSData',
      'cleanupAttrs',
      'mergeStyles',
      'inlineStyles',
      'minifyStyles',
      'cleanupIds',
      'removeUselessDefs',
      'cleanupNumericValues',
      'convertColors',
      'removeUnknownsAndDefaults',
      'removeNonInheritableGroupAttrs',
      'removeUselessStrokeAndFill',
      'cleanupEnableBackground',
      'removeHiddenElems',
      'removeEmptyText',
      'convertShapeToPath',
      'convertEllipseToCircle',
      'moveElemsAttrsToGroup',
      'moveGroupAttrsToElems',
      'collapseGroups',
      'convertPathData',
      'convertTransform',
      'removeEmptyAttrs',
      'removeEmptyContainers',
      'mergePaths',
      'removeUnusedNS',
      'sortAttrs',
      'sortDefsChildren',
      'removeTitle',
      'removeDesc'
    ]
  });

  const finalSvg = optimized.data;
  totalFlagBytesAfter += finalSvg.length;
  fs.writeFileSync(destFile, finalSvg, 'utf8');
}

console.log(`Optimized 193 flags:`);
console.log(`  Raw size:       ${Math.round(totalFlagBytesBefore / 1024)} KB`);
console.log(`  Optimized size: ${Math.round(totalFlagBytesAfter / 1024)} KB (${Math.round((1 - totalFlagBytesAfter / totalFlagBytesBefore) * 100)}% reduction)`);
if (missingFlags > 0) {
  console.warn(`  Missing flags: ${missingFlags}`);
}

// 3. Copy Leaflet Assets
console.log('\n--- 3. Copying Leaflet 1.9.4 Vendor Files ---');
const leafletDist = path.join(__dirname, 'node_modules', 'leaflet', 'dist');
const vendorJsDir = path.join(assetsDir, 'vendor');
const vendorCssDir = path.join(assetsDir, 'vendor');
ensureDir(vendorJsDir);

fs.copyFileSync(path.join(leafletDist, 'leaflet.js'), path.join(vendorJsDir, 'leaflet.js'));
fs.copyFileSync(path.join(leafletDist, 'leaflet.css'), path.join(vendorCssDir, 'leaflet.css'));
console.log(`Copied leaflet.js and leaflet.css to assets/vendor/`);

// 4. Create LICENSES File
console.log('\n--- 4. Generating LICENSES ---');
const licensesContent = `Flag Finder: World Tour - Third-Party Notices & Licenses
====================================================================

This game bundles local open-source components strictly adhering to offline, self-contained requirements:

1. Leaflet.js
Version: 1.9.4
License: BSD 2-Clause License
Copyright (c) 2010-2023, Vladimir Agafonkin
Copyright (c) 2014-2023, Cloudflare, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

2. Flag Icons (lipis/flag-icons)
License: MIT License
Copyright (c) 2013-2024 Panayiotis Lipiridis
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

3. Natural Earth / World Atlas (TopoJSON)
License: Public Domain / ISC
Map geometry derived from Natural Earth 1:110m vector data. Natural Earth is in the Public Domain.
TopoJSON specification and client code copyright (c) Mike Bostock.
`;

fs.writeFileSync(path.join(distDir, 'LICENSES'), licensesContent, 'utf8');
console.log(`Created dist/LICENSES`);

console.log('\nAsset preparation complete! Build assets ready in dist/assets/');

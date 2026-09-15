const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Case = require('../models/Case');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Case.deleteMany({});
        await Document.deleteMany({});
        await AuditLog.deleteMany({});
        console.log('Cleared existing data.');

        // 1. Create Users
        const passwordHash = await bcrypt.hash('Admin@123', 10);

        const users = await User.create([
            {
                name: 'Inspector Rajesh Sharma',
                email: 'rajesh.sharma@police.gov.in',
                password: passwordHash,
                role: 'officer',
                station: 'Central Police Station, Delhi',
                formNumber: 'DL-IND-4081',
                badgeId: 'DL-IND-4081',
                department: 'Homicide & Special Crimes',
                phone: '+91 9876543210'
            },
            {
                name: 'ACP Priya Patel',
                email: 'priya.patel@police.gov.in',
                password: passwordHash,
                role: 'super_admin',
                station: 'Central Police Station, Delhi',
                formNumber: 'DL-ACP-1002',
                badgeId: 'DL-ACP-1002',
                department: 'Cyber & Forensics Directorate',
                phone: '+91 9876543211'
            },
            {
                name: 'Dr. Vivek Menon',
                email: 'vivek.menon@forensics.gov.in',
                password: passwordHash,
                role: 'forensic_expert',
                station: 'Central Forensic Science Lab (CFSL)',
                formNumber: 'CFSL-DOC-892',
                badgeId: 'CFSL-DOC-892',
                department: 'Digital & Chemical Forensics',
                phone: '+91 9876543212'
            },
            {
                name: 'Sub-Inspector Ankit Verma',
                email: 'ankit.verma@police.gov.in',
                password: passwordHash,
                role: 'officer',
                station: 'South District Station, Mumbai',
                formNumber: 'MH-SI-6029',
                badgeId: 'MH-SI-6029',
                department: 'Law & Order',
                phone: '+91 9876543213'
            }
        ]);

        console.log(`Created ${users.length} demo users`);

        // 2. Create Cases
        const cases = await Case.create([
            {
                title: 'Operation Nightfall - Cyber Espionage & Data Theft',
                description: 'Investigation into unauthorized exfiltration of sensitive municipal defense data and ransomware deployment.',
                crimeType: 'cybercrime',
                status: 'under_investigation',
                priority: 'critical',
                suspect: {
                    name: 'Kunal "Cipher" Deshmukh',
                    age: 29,
                    gender: 'Male',
                    description: 'Known dark-web intermediary, operating alias "GhostProtocol"'
                },
                victim: {
                    name: 'State Infrastructure Grid Corp',
                    age: 0,
                    gender: 'Other'
                },
                assignedOfficers: [users[0]._id, users[1]._id],
                station: 'Central Police Station, Delhi',
                filingDate: new Date('2024-08-15'),
                courtName: 'Special CBI Court, New Delhi',
                judge: 'Hon. Justice K. Raman',
                createdBy: users[1]._id
            },
            {
                title: 'Homicide Case: Sector-18 Industrial Vault Incident',
                description: 'Unsolved murder and armed burglary at commercial warehouse premises with suspected inside collaboration.',
                crimeType: 'murder',
                status: 'open',
                priority: 'high',
                suspect: {
                    name: 'Vikramaditya Rao',
                    age: 42,
                    gender: 'Male',
                    description: 'Former security coordinator, absconding'
                },
                victim: {
                    name: 'Mohan Lal Agarwal',
                    age: 58,
                    gender: 'Male'
                },
                assignedOfficers: [users[0]._id],
                station: 'Central Police Station, Delhi',
                filingDate: new Date('2024-09-01'),
                courtName: 'District & Sessions Court, Delhi',
                judge: 'Hon. Justice S. Chatterjee',
                createdBy: users[0]._id
            },
            {
                title: 'Financial Securities Scam & High-Yield Fund Fraud',
                description: 'Multi-crore fraudulent investment syndicate targeting retired defense personnel across western zone.',
                crimeType: 'fraud',
                status: 'charge_sheeted',
                priority: 'high',
                suspect: {
                    name: 'Sonia Merchant & Associates',
                    age: 36,
                    gender: 'Female',
                    description: 'Directors of Zenith Wealth Management'
                },
                victim: {
                    name: 'Retired Armed Forces Welfare Trust',
                    age: 0,
                    gender: 'Other'
                },
                assignedOfficers: [users[3]._id],
                station: 'South District Station, Mumbai',
                filingDate: new Date('2024-07-10'),
                courtName: 'High Court of Bombay',
                judge: 'Hon. Justice M. Deshpande',
                createdBy: users[3]._id
            }
        ]);

        console.log(`Created ${cases.length} sample cases`);

        // 3. Create Audit Logs
        await AuditLog.create([
            {
                user: users[1]._id,
                action: 'login',
                targetType: 'system',
                details: 'ACP Priya Patel authenticated successfully from secure terminal',
                ipAddress: '192.168.1.105',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0'
            },
            {
                user: users[0]._id,
                action: 'create',
                targetType: 'case',
                targetId: cases[1]._id,
                details: `Case registered: ${cases[1].title}`,
                ipAddress: '192.168.1.108',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0'
            },
            {
                user: users[2]._id,
                action: 'view',
                targetType: 'document',
                details: 'Digital Forensic Report accessed via Spotlight Viewer',
                ipAddress: '192.168.2.44',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0'
            }
        ]);

        console.log('Sample audit logs created.');
        console.log('\n========================================');
        console.log('✅ DEMO DATA SEEDED SUCCESSFULLY!');
        console.log('========================================');
        console.log('Login credentials for demo:');
        console.log('  Email:    priya.patel@police.gov.in (Admin)');
        console.log('  Email:    rajesh.sharma@police.gov.in (Investigator)');
        console.log('  Email:    vivek.menon@forensics.gov.in (Forensic Analyst)');
        console.log('  Email:    ankit.verma@police.gov.in (Officer - Mumbai)');
        console.log('  Password: Admin@123 (for all users)');
        console.log('========================================\n');

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedData();

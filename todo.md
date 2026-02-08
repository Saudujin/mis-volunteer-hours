# MIS Volunteer Hours Tracking System - TODO

## Core Features
- [x] Simple achievement registration form (university ID, achievement type dropdown, image upload)
- [x] Arabic to English numeral conversion for university ID
- [x] Google Drive integration for image uploads
- [x] Google Sheets integration for data storage (Requests sheet)
- [x] HR admin review interface for pending requests
- [x] Approval workflow with automatic hours calculation
- [x] Achievement details aggregation in Members sheet
- [x] Admin page for managing achievement types and hours
- [x] Automatic notifications to HR admins on new submissions

## Design
- [x] Minimal black and white design
- [x] IBM Plex Arabic font integration
- [x] RTL support for Arabic interface

## Documentation
- [x] Google Sheets setup guide (Members, Requests, AchievementTypes sheets)
- [x] Required formulas documentation
- [x] Google Sheets API connection guide
- [x] Google Drive API setup instructions

## Technical
- [x] Server-side Google Sheets API integration
- [x] Server-side Google Drive API integration
- [x] tRPC procedures for all operations
- [x] Vitest tests for critical functions

## Changes
- [x] Change achievement type dropdown to free text description field
- [x] Connected Google Sheets and Google Drive APIs with service account credentials

## Bugs
- [x] Fix Google Drive image upload error (switched to S3 storage)
- [x] Replace S3 storage with Cloudinary for external hosting compatibility
- [x] Optimize image upload speed (compress images before upload)
- [x] Fix: Requests sheet - only write to columns A-E, leave F (CheckBox) and G (Dropdown) for manual input
- [ ] Fix: Members sheet formulas for cumulative hours (column J) and achievement details (column K)
- [x] Auto-add CheckBox in column F and Dropdown (فلان, فلان 2, فلان 3) in column G when new request is submitted
- [ ] Add vercel.json and make Express server compatible with Vercel Serverless Functions

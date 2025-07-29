# Contact Field Implementation

## Summary of Changes

This implementation adds a contact input field next to the username field in the profile creation form. The contact field accepts either email or phone number and is saved to the database when users click "Find my connections".

## Files Modified

### 1. Frontend Changes (`src/app/page.tsx`)

#### State Management

- Added `contactInfo` and `contactError` state variables
- Updated ProfileFormScreenProps interface to include contact field props
- Added contact props to ProfileFormScreen component call and destructuring

#### UI Changes

- Modified the username input section to display both username and contact fields side by side
- Used a responsive grid layout (single column on mobile, two columns on desktop)
- Added proper labels, placeholders, and error handling for the contact field

#### Form Submission

- Updated the `handleSubmit` function to include contact info in the API call to `/api/save-profile`

### 2. API Changes (`src/app/api/save-profile/route.ts`)

- Updated the POST handler to extract `contact` from the request body
- Passed the contact field to the `saveUserProfile` function

### 3. Database Layer (`src/lib/database.ts`)

- Updated `saveUserProfile` function signature to accept an optional `contact` parameter
- Modified the Supabase upsert operation to include the contact field

### 4. Type Definitions (`src/lib/supabase.ts`)

- Added `contact?: string` to the `UserProfile` interface

### 5. Database Migration (`migration-add-contact-column.sql`)

- Created a SQL migration file to add the `contact` column to the `user_profiles` table
- The column is nullable since existing users may not have contact information
- Added appropriate documentation for the column

## Database Schema Changes

The `user_profiles` table now includes:

```sql
ALTER TABLE user_profiles
ADD COLUMN contact TEXT;
```

This column:

- Is nullable (not required)
- Is not unique (multiple users could potentially share contact methods)
- Accepts any text format (email or phone number)

## How to Apply Database Changes

Run the following SQL command in your Supabase SQL Editor:

```sql
ALTER TABLE user_profiles
ADD COLUMN contact TEXT;

COMMENT ON COLUMN user_profiles.contact IS 'User contact information (email or phone number)';
```

## Usage

1. Users can now enter their contact information (email or phone) alongside their username
2. The contact field is optional - users can leave it empty
3. When the form is submitted, the contact information is saved to the database
4. The contact field supports both email addresses and phone numbers in any format

## UI Layout

- On desktop: Username and contact fields appear side by side
- On mobile: Fields stack vertically for better mobile experience
- Both fields include proper labels and error handling
- The contact field has a descriptive placeholder showing example formats

## Technical Notes

- The contact field validation is currently handled at the UI level
- The database column accepts any text format for flexibility
- No unique constraint on the contact field to allow shared contact methods
- Error handling is implemented for both frontend validation and backend processing

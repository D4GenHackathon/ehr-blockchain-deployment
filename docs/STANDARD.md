# Healthcare Standard Guidance: Rule mapping from healthcare docs to system design
## Health Insurance Portability and Accountability Act (HIPAA) minimum necessary standard (45 CFR 164.502(b), 164.514(d))
### Technical safeguards protect access to ePHI (electronic protected health information).
- Access control allows only authorized persons to access ePHI at the right data level, role, and action: Smart Contract Rule & Agreements with relevant CRUD actions.
- Authentication verifies that the person requesting access is who they say they are (user views EHR records): Backend Authentication (Login, Signup Process).
- Transmission security protects ePHI while it is sent over an electronic network: ZKP technology can be used in access control and verification.
- Purpose: build trust in patients, providers, and customers through transparency and secure procedure, which lead to totally transparent access between healthcare providers and authorized centers or organizations.

### HIPAA SC system design
- Access control is handled by smart contracts.
- Data levels can be separated by role:
  - Healthcare providers: full or CRUD-level EHR access where permitted.
  - Hospitals and clinical or research centers: metadata plus selected EHR attributes.
  - Commercial or biotech institutions: non-EHR records, mainly metadata.
- Error warnings can be used for wrong roles, wrong access level, or unauthorized actions.
### Backend Flow 
- Error raises when unathorized access is altered through SCs.
- Preprocessing module to access ZKP attribute only for specific roles.

## General Data Protection Regulation (GDPR), National Law 206/2004 data usage regulations 
### GDPR SC system design
- Access control follows the same basic rule as HIPAA.
- Data protection follows the same privacy principle as HIPAA.
- Limitation of party data storage means separating EHR demographic data (future works) and limiting the number of EHR records stored or shared (default for each role, fixed setup):
  - Healthcare providers: full EHR records, max 500 records shared.
  - Hospitals and clinical or research centers: max 300 EHR records, max 200 records shared.
  - Commercial or biotech institutions: non-EHR records, non-share.
### Backend Flow 
- Personal data portability means the user can extract required data in a structured and automatic format (more detailed in backend logic with export file format).


export const PII_CATEGORIES = {
  EMAIL: {
    key: 'EMAIL',
    label: 'Email',
    pluralLabel: 'Emails',
    shortCode: 'EML',
    pseudonymPrefix: 'EMAIL',
    description: 'Electronic mail addresses across RFC-compliant local & domain segments.',
    badgeClass: 'bg-[#EAE6F7] text-[#3B2E6E] border-[#D2C9EC]',
    highlightClass: 'bg-[#EAE6F7]/90 text-[#3B2E6E] border border-[#8B7CC8]/50 rounded-[5px]',
    barColor: '#3B2E6E',
  },
  PHONE: {
    key: 'PHONE',
    label: 'Phone',
    pluralLabel: 'Phone Numbers',
    shortCode: 'PHN',
    pseudonymPrefix: 'PHONE',
    description: 'Indian mobile formats (+91, 91, 0, and 10-digit [6-9]XXXXXXXXX variants).',
    badgeClass: 'bg-[#FDF1DF] text-[#9A5B13] border-[#F0D3A8]',
    highlightClass: 'bg-[#FDF1DF] text-[#8F5210] border border-[#E8A34A]/60 rounded-[5px]',
    barColor: '#E8A34A',
  },
  IP_ADDRESS: {
    key: 'IP_ADDRESS',
    label: 'IP Address',
    pluralLabel: 'IP Addresses',
    shortCode: 'IP4',
    pseudonymPrefix: 'IP',
    description: 'IPv4 network endpoints with strict 0–255 per-octet validation.',
    badgeClass: 'bg-[#EBF1FA] text-[#2D4A7C] border-[#C8D7EE]',
    highlightClass: 'bg-[#EBF1FA] text-[#3B2E6E] border border-[#8B7CC8]/45 rounded-[5px]',
    barColor: '#8B7CC8',
  },
  PAN: {
    key: 'PAN',
    label: 'PAN',
    pluralLabel: 'PAN Numbers',
    shortCode: 'PAN',
    pseudonymPrefix: 'PAN',
    description: 'Indian Permanent Account Number structure (AAAAA9999A). Format check only.',
    badgeClass: 'bg-[#F2EEF8] text-[#22202B] border-[#D7CEE8]',
    highlightClass: 'bg-[#EFEAF8] text-[#22202B] border border-[#B5A8DA] rounded-[5px]',
    barColor: '#8B7CC8',
  },
  AADHAAR: {
    key: 'AADHAAR',
    label: 'Aadhaar',
    pluralLabel: 'Aadhaar Numbers',
    shortCode: 'ADH',
    pseudonymPrefix: 'AADHAAR',
    description: '12-digit Aadhaar-like format patterns (spaced, hyphenated, or continuous). Format check only.',
    badgeClass: 'bg-[#FBEAE8] text-[#9E3D37] border-[#F0C6C2]',
    highlightClass: 'bg-[#FBEAE8] text-[#8E3530] border border-[#D96C65]/55 rounded-[5px]',
    barColor: '#D96C65',
  },
  CREDIT_CARD: {
    key: 'CREDIT_CARD',
    label: 'Credit Card',
    pluralLabel: 'Credit Cards',
    shortCode: 'CC',
    pseudonymPrefix: 'CARD',
    description: '13–19 digit payment card numbers verified via the Luhn mod-10 algorithm.',
    badgeClass: 'bg-[#3B2E6E] text-[#FFFFFF] border-[#3B2E6E]',
    highlightClass: 'bg-[#3B2E6E]/12 text-[#3B2E6E] border border-[#3B2E6E]/45 rounded-[5px]',
    barColor: '#63549E',
  },
};

export const CATEGORY_ORDER = [
  'EMAIL',
  'PHONE',
  'IP_ADDRESS',
  'PAN',
  'AADHAAR',
  'CREDIT_CARD',
];

export const PROTECTION_MODES = {
  FULL_MASK: {
    id: 'FULL_MASK',
    code: 'Mode 01',
    name: 'Full Mask',
    shortDesc: 'Complete redaction',
    detail: 'Replaces every detected sensitive entity with a uniform [REDACTED] token so zero original characters remain.',
    warningNote: null,
    exampleInput: 'ananya.rao@vault.in',
    exampleOutput: '[REDACTED]',
  },
  PARTIAL_MASK: {
    id: 'PARTIAL_MASK',
    code: 'Mode 02',
    name: 'Partial Mask',
    shortDesc: 'Preserve trailing digits',
    detail: 'Masks sensitive cores while retaining minimal verification context such as the last 4 digits or email domain.',
    warningNote: 'Partial masking retains trailing digits or domain hints.',
    exampleInput: '+91 98201 44210',
    exampleOutput: '+91 ******4210',
  },
  PSEUDONYMIZATION: {
    id: 'PSEUDONYMIZATION',
    code: 'Mode 03',
    name: 'Consistent Pseudonymization',
    shortDesc: 'Referential placeholders',
    detail: 'Replaces recurring values with consistent session placeholders such as EMAIL_01 and PHONE_01 to preserve analytical links.',
    warningNote: 'Pseudonymization preserves cross-record linkability within the document.',
    exampleInput: 'ananya.rao@vault.in',
    exampleOutput: 'EMAIL_01',
  },
};

export const SYNTHETIC_SAMPLE_TEXT = `# CYBERBLOOM // SYNTHETIC AUDIT LOG (TEST DATA ONLY)
Incident Ref: INC-2026-0842 | Environment: LOCAL-SANDBOX

[01] Primary Analyst: ananya.rao@cyberbloom-lab.test | Phone: +91 98201 44210
[02] Escalation Contact: dev.kulkarni@finnode.example | Backup: 91-8879012345
[03] Duplicate Reference: Re-pinged ananya.rao@cyberbloom-lab.test from node 192.168.14.22
[04] Secondary Audit Thread: CC dev.kulkarni@finnode.example & sec.audit@finnode.example
[05] Same Caller Re-entry: Callback verified on +91 98201 44210 and mobile 77604 55109

[06] Tax & Identity Identifiers (Synthetic Format Tests):
     - Primary PAN: ABCDE1234F | Alternate PAN: BNZPM2501K
     - Repeated PAN Check: ABCDE1234F matched on gateway 10.42.108.7
     - Aadhaar Token A: 4821 9034 1182
     - Aadhaar Token B: 7392-5501-8843

[07] Network Telemetry:
     - Valid Ingress IPv4: 172.16.254.1
     - Invalid Octet Control (Ignored): 256.88.1.4 and 999.12.0.1

[08] Payment Card Validation (Luhn Algorithm Test):
     - Valid Test Card #1 (Luhn PASS): 4111 1111 1111 1111
     - Valid Test Card #2 (Luhn PASS): 4242-4242-4242-4242
     - Valid Test Card #3 (Luhn PASS): 5500 0000 0000 0004
     - Failed Checksum #1 (Luhn FAIL - Ignored): 4111 1111 1111 1112
     - Failed Checksum #2 (Luhn FAIL - Ignored): 5432 9876 5432 1098`;

export const SYNTHETIC_SAMPLE_CSV = `record_id,full_name,email,phone,ip_address,pan,aadhaar,card_number,notes
REC-01,Ananya Rao,ananya.rao@cyberbloom-lab.test,+91 98201 44210,192.168.14.22,ABCDE1234F,4821 9034 1182,4111 1111 1111 1111,"Primary synthetic record, valid Luhn"
REC-02,Dev Kulkarni,dev.kulkarni@finnode.example,91-8879012345,10.42.108.7,BNZPM2501K,7392-5501-8843,4242-4242-4242-4242,"Valid Luhn Mastercard/Visa test"
REC-03,Ananya Rao (Dup),ananya.rao@cyberbloom-lab.test,+91 98201 44210,172.16.254.1,ABCDE1234F,4821 9034 1182,4111 1111 1111 1112,"Repeated email/phone/PAN; card fails Luhn"
REC-04,Meera Nair,sec.audit@finnode.example,77604 55109,256.88.1.4,PQRSX9012M,610422983310,5500 0000 0000 0004,"Invalid IPv4 256.88.1.4 ignored; valid card"`;

# M1 Core Services — Integration Test Scenarios

> **📌 Proactive** — Written 2026-05-14 against requirements; may need adjustment once implementations land.
>
> **Automated:** `tests/m1-smoke-tests.sh` — curl-based smoke tests
> **Runner:** `tests/docker-compose-test.sh` — orchestrates compose + health + tests

---

## Table of Contents

1. [Service Inventory](#1-service-inventory)
2. [ZavaAuthGateway Tests](#2-zavauthgateway-net-formsauth)
3. [ZavaCurrencyService Tests](#3-zavacurrencyservice-wcf-soap)
4. [ZavaLedger Tests](#4-zavaledger-java-17-servlet)
5. [ZavaKYCService Tests](#5-zavakycservice-java-8-servlet)
6. [Cross-Service Integration](#6-cross-service-integration)
7. [Era-Appropriateness Checks](#7-era-appropriateness-checks)
8. [Edge Cases](#8-edge-cases)
9. [Environment & Ports](#9-environment--ports)

---

## 1. Service Inventory

| Service | Tech | Host Port | Container Port | Protocol |
|---------|------|-----------|----------------|----------|
| ZavaAuthGateway | .NET FormsAuth / Mono XSP4 | 8004 | 8080 | HTTP (Forms + REST) |
| ZavaCurrencyService | WCF / BasicHttpBinding | 8008 | 8080 | SOAP/XML |
| ZavaLedger | Java 17 Servlet / Tomcat | 9004 | 8080 | HTTP REST (XML) |
| ZavaKYCService | Java 8 Servlet / Tomcat | 9005 | 8080 | HTTP REST (JSON) |

---

## 2. ZavaAuthGateway (.NET FormsAuth)

### TC-AUTH-001: Login page accessible
- **Method:** GET `/Login.aspx`
- **Expected:** HTTP 200, HTML page with login form
- **Validates:** XSP4/Mono serving Web Forms pages

### TC-AUTH-002: Valid login
- **Method:** POST `/Login.aspx`
- **Body:** `username=admin&password=Password1!`
- **Expected:** HTTP 302 → 200, `.ZAVAAUTH` cookie set in response
- **Validates:** FormsAuth authentication, SHA-1 password check, SessionTokens table write

### TC-AUTH-003: Token validation
- **Method:** GET `/api/auth/validate`
- **Headers:** `Cookie: .ZAVAAUTH=<token_from_login>`
- **Expected:** HTTP 200, response contains user identity
- **Validates:** Cross-ecosystem SSO token validation (Java services call this)

### TC-AUTH-004: Invalid credentials
- **Method:** POST `/Login.aspx`
- **Body:** `username=baduser&password=wrongpass`
- **Expected:** HTTP 401 or HTTP 200 with error message (no cookie set)
- **Validates:** Failed auth doesn't issue tokens

### TC-AUTH-005: Logout
- **Method:** GET/POST `/api/auth/logout`
- **Headers:** Valid `.ZAVAAUTH` cookie
- **Expected:** HTTP 200 or 302, session token invalidated
- **Validates:** Token cleanup in SessionTokens table

### TC-AUTH-006: Expired/invalid token
- **Method:** GET `/api/auth/validate`
- **Headers:** `Cookie: .ZAVAAUTH=totally_invalid_token`
- **Expected:** HTTP 401
- **Validates:** Token validation rejects garbage tokens

---

## 3. ZavaCurrencyService (WCF SOAP)

### TC-CUR-001: WSDL accessible
- **Method:** GET `/CurrencyService.svc?wsdl`
- **Expected:** HTTP 200, XML document with `<wsdl:definitions>` root
- **Validates:** WCF metadata endpoint, BasicHttpBinding config
- **Era gate:** ✅ Real SOAP WSDL — this IS the 2005–2015 pattern

### TC-CUR-002: GetSupportedCurrencies
- **Method:** POST `/CurrencyService.svc`
- **SOAPAction:** `http://zava.bank/wcf/currency/IZavaCurrencyService/GetSupportedCurrencies`
- **Body:**
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="http://zava.bank/wcf/currency/">
  <soap:Body>
    <cur:GetSupportedCurrencies/>
  </soap:Body>
</soap:Envelope>
```
- **Expected:** HTTP 200, SOAP response containing currency codes (USD, EUR, GBP minimum)
- **Validates:** SOAP deserialization, database read from CurrencyPairs table

### TC-CUR-003: GetExchangeRate (USD→EUR)
- **Method:** POST `/CurrencyService.svc`
- **SOAPAction:** `http://zava.bank/wcf/currency/IZavaCurrencyService/GetExchangeRate`
- **Body:**
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="http://zava.bank/wcf/currency/">
  <soap:Body>
    <cur:GetExchangeRate>
      <cur:request>
        <cur:FromCurrency>USD</cur:FromCurrency>
        <cur:ToCurrency>EUR</cur:ToCurrency>
      </cur:request>
    </cur:GetExchangeRate>
  </soap:Body>
</soap:Envelope>
```
- **Expected:** HTTP 200, response contains `<MidRate>`, `<BidRate>`, `<AskRate>` with numeric values
- **Validates:** ExchangeRates table lookup, rate calculation

### TC-CUR-004: ConvertAmount (100 USD→EUR)
- **Method:** POST `/CurrencyService.svc`
- **SOAPAction:** `http://zava.bank/wcf/currency/IZavaCurrencyService/ConvertAmount`
- **Body:** ConvertAmountRequest with Amount=100, From=USD, To=EUR
- **Expected:** HTTP 200, response contains `<ConvertedAmount>` with realistic value (e.g., 80–95)
- **Validates:** Rate lookup + multiplication logic

### TC-CUR-005: Invalid currency pair (SOAP Fault)
- **Method:** POST `/CurrencyService.svc`
- **Body:** GetExchangeRate with FromCurrency=ZZZ, ToCurrency=QQQ
- **Expected:** HTTP 500, SOAP Fault with `<CurrencyFault>` containing error code
- **Validates:** Fault contract handling, era-appropriate error response

---

## 4. ZavaLedger (Java 17 Servlet)

### TC-LED-001: GET account balance
- **Method:** GET `/api/accounts/100001/balance`
- **Headers:** `Accept: application/xml`
- **Expected:** HTTP 200, XML response with `<accountId>`, `<balance>`, `<currency>`
- **Validates:** Account lookup, XML serialization

### TC-LED-002: GET account transactions
- **Method:** GET `/api/accounts/100001/transactions`
- **Headers:** `Accept: application/xml`
- **Expected:** HTTP 200, XML response with `<transactions>` list
- **Validates:** Transaction history query

### TC-LED-003: POST transaction (double-entry)
- **Method:** POST `/api/transactions`
- **Headers:** `Content-Type: application/xml`
- **Body:**
```xml
<transaction>
  <debitAccountId>100001</debitAccountId>
  <creditAccountId>100002</creditAccountId>
  <amount>50.00</amount>
  <currency>USD</currency>
  <description>Smoke test transfer</description>
  <transactionType>TRANSFER</transactionType>
</transaction>
```
- **Expected:** HTTP 201, XML response with `<transactionId>`, both debit and credit entries created
- **Validates:** Double-entry bookkeeping, XML request parsing

### TC-LED-004: Balance changes after transaction
- **Method:** GET balance before and after POST transaction
- **Expected:** Debit account balance decreases by transaction amount
- **Validates:** Transactional consistency

### TC-LED-005: Non-existent account
- **Method:** GET `/api/accounts/999999/balance`
- **Expected:** HTTP 404
- **Validates:** Error handling for missing resources

### TC-LED-006: Invalid transaction (missing fields)
- **Method:** POST `/api/transactions` with incomplete XML (missing creditAccountId)
- **Expected:** HTTP 400, error message in response
- **Validates:** Input validation

### TC-LED-007: Insufficient balance (overdraft)
- **Method:** POST transaction with amount exceeding account balance
- **Expected:** HTTP 400 or 422, error indicating insufficient funds
- **Validates:** Business rule enforcement

---

## 5. ZavaKYCService (Java 8 Servlet)

### TC-KYC-001: POST KYC verify (clean customer)
- **Method:** POST `/api/kyc/verify`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "customerId": 1001,
  "firstName": "John",
  "lastName": "Smith",
  "dateOfBirth": "1985-03-15",
  "ssn": "123-45-6789",
  "address": "123 Main St, Springfield, IL 62701"
}
```
- **Expected:** HTTP 200, JSON response with `"status": "VERIFIED"` or `"CLEAR"`
- **Validates:** Watchlist check, identity verification logic

### TC-KYC-002: GET KYC status
- **Method:** GET `/api/kyc/status/1001`
- **Expected:** HTTP 200, JSON with `customerId`, `status`, `verifiedDate`
- **Validates:** Status lookup from KYCVerifications table

### TC-KYC-003: Watchlist hit
- **Method:** POST `/api/kyc/verify` with watchlisted name
- **Expected:** HTTP 200 with `"status": "FLAGGED"` or HTTP 403
- **Validates:** Watchlist checking against KYCWatchList table

### TC-KYC-004: Non-existent customer status
- **Method:** GET `/api/kyc/status/999999`
- **Expected:** HTTP 404
- **Validates:** Missing resource handling

### TC-KYC-005: Invalid request body
- **Method:** POST `/api/kyc/verify` with malformed JSON
- **Expected:** HTTP 400
- **Validates:** Input validation

---

## 6. Cross-Service Integration

### TC-INT-001: Full Demo Scenario — Authenticate → KYC → Transact → Verify

This is the primary demo storyline flow:

| Step | Service | Action | Expected |
|------|---------|--------|----------|
| 1 | AuthGateway | POST login | `.ZAVAAUTH` cookie issued |
| 2 | AuthGateway | GET validate (with cookie) | HTTP 200, user identity confirmed |
| 3 | KYCService | GET status for customer | HTTP 200, KYC status returned |
| 4 | Ledger | POST transaction | HTTP 201, transaction ID returned |
| 5 | Ledger | GET balance | Balance reflects new transaction |

### TC-INT-002: Cross-Ecosystem SSO Token Validation

- Login via .NET AuthGateway → obtain `.ZAVAAUTH` cookie
- Pass token to AuthGateway's `/api/auth/validate` as header (simulating Java service call)
- **Expected:** Token is valid — proves the SessionTokens table enables cross-ecosystem SSO

### TC-INT-003: Currency → Ledger Integration (future)

- Get exchange rate from CurrencyService (SOAP)
- Post a foreign-currency transaction to Ledger (XML)
- **Expected:** Transaction records the FX rate used
- **Note:** This may require M2+ implementation; mark as stretch goal

---

## 7. Era-Appropriateness Checks

These are quality gates ensuring the demoware looks authentically 2005–2015:

| Check | What | How | Pass Criteria |
|-------|------|-----|---------------|
| ERA-001 | SOAP WSDL | GET `?wsdl` | Returns valid WSDL XML with `<wsdl:definitions>` |
| ERA-002 | XML responses | Check Content-Type from Ledger | `application/xml` or `text/xml` |
| ERA-003 | FormsAuth cookies | Inspect login response | `.ZAVAAUTH` cookie, not Bearer/JWT |
| ERA-004 | No REST on WCF | Attempt GET on CurrencyService | Should not return JSON REST responses |
| ERA-005 | Web Forms page | Check Login.aspx | Contains `__VIEWSTATE` hidden field |
| ERA-006 | SOAP Faults | Send bad SOAP request | Returns `<soap:Fault>` not JSON error |

---

## 8. Edge Cases

### Authentication
- **AUTH-EDGE-001:** Empty username/password → 400 or error page
- **AUTH-EDGE-002:** SQL injection attempt (`' OR 1=1 --`) → No data leak, proper error
- **AUTH-EDGE-003:** Concurrent logins from same user → Both tokens valid
- **AUTH-EDGE-004:** Token reuse after logout → 401

### Ledger
- **LED-EDGE-001:** Transaction with amount = 0 → 400
- **LED-EDGE-002:** Transaction with negative amount → 400
- **LED-EDGE-003:** Same account as debit and credit → 400
- **LED-EDGE-004:** Very large amount (999999999.99) → appropriate handling

### Currency
- **CUR-EDGE-001:** Same currency conversion (USD→USD) → rate = 1.0
- **CUR-EDGE-002:** Malformed SOAP envelope → 400 or 500
- **CUR-EDGE-003:** Empty SOAP body → appropriate fault

### KYC
- **KYC-EDGE-001:** Duplicate verification for same customer → updates existing record
- **KYC-EDGE-002:** Missing SSN field → 400
- **KYC-EDGE-003:** Future date of birth → 400

---

## 9. Environment & Ports

### Docker Compose Services (M1)

```
sqlserver          → localhost:1433  (SQL Server 2022)
rabbitmq           → localhost:15672 (RabbitMQ Management)
zava-auth-service  → localhost:8003  (AuthGateway)
zava-currency-service → localhost:8004 (CurrencyService)
zava-ledger-core   → localhost:9004  (Ledger)
zava-kyc-service   → localhost:9005  (KYCService)
```

### Running Tests

```bash
# Option 1: Full lifecycle (compose up → test → optional teardown)
bash tests/docker-compose-test.sh

# Option 2: Tests only (assumes compose is already running)
bash tests/m1-smoke-tests.sh

# Option 3: With teardown
TEARDOWN=true bash tests/docker-compose-test.sh
```

### Test Data Assumptions

Tests assume the following seed data exists (from `infrastructure/sql/` init scripts):

| Entity | ID | Details |
|--------|----|---------|
| User | admin | Password: Password1! (SHA-1 hashed with salt) |
| User | teller.jones | Password: Teller2024 |
| User | fraud.analyst.chen | Password: Fraud2024 |
| User | maria.rodriguez | Password: Customer1 |
| Customer | 1 | Maria Rodriguez — clean KYC |
| Account | 100001 | Checking — customer 1 |
| Currency | USD, EUR, GBP | Minimum supported pairs |

---

*Last updated: 2026-05-14 — qa_integration (proactive, pre-implementation)*

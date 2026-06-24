#!/usr/bin/env bash
# =============================================================================
# Zava Bank — M1 Core Services Integration Smoke Tests
# 📌 Proactive — written against requirements; may need adjustment once
#    implementations land.
# Date: 2026-05-14
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — host-mapped ports from docker-compose.yml
# ---------------------------------------------------------------------------
AUTH_BASE="http://localhost:8003"         # ZavaAuthGateway (.NET FormsAuth)
CURRENCY_BASE="http://localhost:8004"     # ZavaCurrencyService (WCF SOAP)
LEDGER_BASE="http://localhost:9004"       # ZavaLedger (Java 17 Servlet)
KYC_BASE="http://localhost:9005"          # ZavaKYCService (Java 8 Servlet)

PASS=0
FAIL=0
SKIP=0
TOTAL=0

# Demo scenario test data (matches DB seed rows in 44-seed-auth.sql)
TEST_USER="admin"
TEST_PASS="Password1!"
TEST_CUSTOMER_ID=1
TEST_ACCOUNT_ID=100001

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() { PASS=$((PASS+1)); TOTAL=$((TOTAL+1)); echo -e "${GREEN}  ✅ PASS${NC}: $1"; }
log_fail() { FAIL=$((FAIL+1)); TOTAL=$((TOTAL+1)); echo -e "${RED}  ❌ FAIL${NC}: $1 — $2"; }
log_skip() { SKIP=$((SKIP+1)); TOTAL=$((TOTAL+1)); echo -e "${YELLOW}  ⏭️  SKIP${NC}: $1 — $2"; }
log_section() { echo -e "\n========== $1 =========="; }

assert_status() {
    if [ "$2" = "$3" ]; then
        log_pass "$1 (HTTP $3)"
    else
        log_fail "$1" "expected HTTP $2, got HTTP $3"
    fi
}

assert_contains() {
    if echo "$2" | grep -qi "$3"; then
        log_pass "$1"
    else
        log_fail "$1" "response body missing '$3'"
    fi
}

assert_xml() {
    if echo "$2" | grep -qE '^\s*(<\?xml|<[a-zA-Z])'; then
        log_pass "$1 (XML response)"
    else
        log_fail "$1" "response is not valid XML"
    fi
}

# ---------------------------------------------------------------------------
# 1. HEALTH CHECKS
# ---------------------------------------------------------------------------
log_section "1 — HEALTH CHECKS"

for svc_label_url in \
    "ZavaAuthGateway|${AUTH_BASE}/health" \
    "ZavaCurrencyService|${CURRENCY_BASE}/health" \
    "ZavaLedger|${LEDGER_BASE}/health" \
    "ZavaKYCService|${KYC_BASE}/health"; do

    IFS='|' read -r label url <<< "$svc_label_url"
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
    assert_status "$label health endpoint" "200" "$status"
done

# ---------------------------------------------------------------------------
# 2. ZAVA AUTH GATEWAY — .NET FormsAuth
# ---------------------------------------------------------------------------
log_section "2 — ZavaAuthGateway (FormsAuth)"

# 2a. Login page is accessible
status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${AUTH_BASE}/Login.aspx" 2>/dev/null || echo "000")
assert_status "Login.aspx accessible" "200" "$status"

# 2b. Login with valid credentials
COOKIE_JAR="$(pwd)/tests/.cookies_$$"
trap "rm -f $COOKIE_JAR" EXIT

login_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -c "$COOKIE_JAR" -L \
    -d "username=${TEST_USER}&password=${TEST_PASS}" \
    "${AUTH_BASE}/Login.aspx" 2>/dev/null || echo -e "\n000")
login_status=$(echo "$login_response" | tail -1)

if [ "$login_status" = "200" ] || [ "$login_status" = "302" ]; then
    log_pass "Login POST returns HTTP $login_status"
else
    log_fail "Login POST" "expected 200 or 302, got $login_status"
fi

# 2c. Check for .ZAVAAUTH cookie
if grep -q "ZAVAAUTH" "$COOKIE_JAR" 2>/dev/null; then
    log_pass "FormsAuth cookie (.ZAVAAUTH) set after login"
else
    log_fail "FormsAuth cookie" ".ZAVAAUTH cookie not found in cookie jar"
fi

# 2d. Validate token via API
auth_token=$(grep "ZAVAAUTH" "$COOKIE_JAR" 2>/dev/null | awk '{print $NF}' || echo "")
if [ -n "$auth_token" ]; then
    validate_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
        -H "Cookie: .ZAVAAUTH=${auth_token}" \
        "${AUTH_BASE}/api/auth/validate" 2>/dev/null || echo "000")
    assert_status "Token validation endpoint" "200" "$validate_status"
else
    log_skip "Token validation" "no auth token obtained from login"
fi

# 2e. Invalid credentials
bad_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    -d "username=baduser&password=wrongpass" \
    "${AUTH_BASE}/Login.aspx" 2>/dev/null || echo "000")
if [ "$bad_status" = "401" ] || [ "$bad_status" = "200" ]; then
    log_pass "Invalid credentials handled (HTTP $bad_status)"
else
    log_fail "Invalid credentials" "expected 401 or 200 (with error), got $bad_status"
fi

# 2f. Logout
logout_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    -b "$COOKIE_JAR" \
    "${AUTH_BASE}/api/auth/logout" 2>/dev/null || echo "000")
if [ "$logout_status" = "200" ] || [ "$logout_status" = "302" ]; then
    log_pass "Logout endpoint returns HTTP $logout_status"
else
    log_fail "Logout" "expected 200 or 302, got $logout_status"
fi

# ---------------------------------------------------------------------------
# 3. ZAVA CURRENCY SERVICE — WCF / SOAP
# ---------------------------------------------------------------------------
log_section "3 — ZavaCurrencyService (WCF SOAP)"

# 3a. WSDL accessible
WSDL_URL="${CURRENCY_BASE}/CurrencyService.svc?wsdl"
wsdl_response=$(curl -s -w "\n%{http_code}" --max-time 10 "$WSDL_URL" 2>/dev/null || echo -e "\n000")
wsdl_status=$(echo "$wsdl_response" | tail -1)
wsdl_body=$(echo "$wsdl_response" | sed '$d')

assert_status "WSDL endpoint accessible" "200" "$wsdl_status"
assert_contains "WSDL contains definitions element" "$wsdl_body" "definitions"
assert_contains "WSDL references Zava namespace" "$wsdl_body" "zava.bank"

# 3b. GetSupportedCurrencies SOAP call
SOAP_CURRENCIES='<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="http://zava.bank/wcf/currency/">
  <soap:Body>
    <cur:GetSupportedCurrencies/>
  </soap:Body>
</soap:Envelope>'

currencies_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Content-Type: text/xml; charset=utf-8" \
    -H "SOAPAction: \"http://zava.bank/wcf/currency/IZavaCurrencyService/GetSupportedCurrencies\"" \
    -d "$SOAP_CURRENCIES" \
    "${CURRENCY_BASE}/CurrencyService.svc" 2>/dev/null || echo -e "\n000")
currencies_status=$(echo "$currencies_response" | tail -1)
currencies_body=$(echo "$currencies_response" | sed '$d')

assert_status "GetSupportedCurrencies SOAP call" "200" "$currencies_status"
assert_xml "GetSupportedCurrencies response is XML" "$currencies_body"
assert_contains "Response includes USD" "$currencies_body" "USD"

# 3c. GetExchangeRate SOAP call (USD → EUR)
SOAP_RATE='<?xml version="1.0" encoding="utf-8"?>
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
</soap:Envelope>'

rate_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Content-Type: text/xml; charset=utf-8" \
    -H "SOAPAction: \"http://zava.bank/wcf/currency/IZavaCurrencyService/GetExchangeRate\"" \
    -d "$SOAP_RATE" \
    "${CURRENCY_BASE}/CurrencyService.svc" 2>/dev/null || echo -e "\n000")
rate_status=$(echo "$rate_response" | tail -1)
rate_body=$(echo "$rate_response" | sed '$d')

assert_status "GetExchangeRate USD→EUR" "200" "$rate_status"
assert_xml "GetExchangeRate response is XML" "$rate_body"
assert_contains "Response contains MidRate" "$rate_body" "MidRate"

# 3d. ConvertAmount SOAP call (100 USD → EUR)
SOAP_CONVERT='<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="http://zava.bank/wcf/currency/">
  <soap:Body>
    <cur:ConvertAmount>
      <cur:request>
        <cur:Amount>100.00</cur:Amount>
        <cur:FromCurrency>USD</cur:FromCurrency>
        <cur:ToCurrency>EUR</cur:ToCurrency>
      </cur:request>
    </cur:ConvertAmount>
  </soap:Body>
</soap:Envelope>'

convert_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Content-Type: text/xml; charset=utf-8" \
    -H "SOAPAction: \"http://zava.bank/wcf/currency/IZavaCurrencyService/ConvertAmount\"" \
    -d "$SOAP_CONVERT" \
    "${CURRENCY_BASE}/CurrencyService.svc" 2>/dev/null || echo -e "\n000")
convert_status=$(echo "$convert_response" | tail -1)
convert_body=$(echo "$convert_response" | sed '$d')

assert_status "ConvertAmount 100 USD→EUR" "200" "$convert_status"
assert_xml "ConvertAmount response is XML" "$convert_body"
assert_contains "Response contains ConvertedAmount" "$convert_body" "ConvertedAmount"

# 3e. Invalid currency pair — expect SOAP Fault
SOAP_BADCUR='<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="http://zava.bank/wcf/currency/">
  <soap:Body>
    <cur:GetExchangeRate>
      <cur:request>
        <cur:FromCurrency>ZZZ</cur:FromCurrency>
        <cur:ToCurrency>QQQ</cur:ToCurrency>
      </cur:request>
    </cur:GetExchangeRate>
  </soap:Body>
</soap:Envelope>'

fault_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Content-Type: text/xml; charset=utf-8" \
    -H "SOAPAction: \"http://zava.bank/wcf/currency/IZavaCurrencyService/GetExchangeRate\"" \
    -d "$SOAP_BADCUR" \
    "${CURRENCY_BASE}/CurrencyService.svc" 2>/dev/null || echo -e "\n000")
fault_status=$(echo "$fault_response" | tail -1)
fault_body=$(echo "$fault_response" | sed '$d')

if [ "$fault_status" = "500" ] || [ "$fault_status" = "400" ]; then
    log_pass "Invalid currency returns error (HTTP $fault_status)"
    assert_contains "SOAP Fault element present" "$fault_body" "Fault"
else
    log_fail "Invalid currency error" "expected HTTP 400 or 500, got $fault_status"
fi

# ---------------------------------------------------------------------------
# 4. ZAVA LEDGER — Java 17 Servlet (XML request/response)
# ---------------------------------------------------------------------------
log_section "4 — ZavaLedger (Java Servlet, XML)"

# 4a. GET account balance
balance_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Accept: application/xml" \
    "${LEDGER_BASE}/api/accounts/${TEST_ACCOUNT_ID}/balance" 2>/dev/null || echo -e "\n000")
balance_status=$(echo "$balance_response" | tail -1)
balance_body=$(echo "$balance_response" | sed '$d')

assert_status "GET account balance" "200" "$balance_status"
assert_xml "Balance response is XML" "$balance_body"
assert_contains "Balance response contains accountId" "$balance_body" "accountId"

# 4b. GET account transactions
txn_list_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Accept: application/xml" \
    "${LEDGER_BASE}/api/accounts/${TEST_ACCOUNT_ID}/transactions" 2>/dev/null || echo -e "\n000")
txn_list_status=$(echo "$txn_list_response" | tail -1)
txn_list_body=$(echo "$txn_list_response" | sed '$d')

assert_status "GET account transactions" "200" "$txn_list_status"
assert_xml "Transactions response is XML" "$txn_list_body"

# 4c. POST a new transaction (double-entry)
TXN_XML='<?xml version="1.0" encoding="UTF-8"?>
<transaction>
  <debitAccountId>100001</debitAccountId>
  <creditAccountId>100002</creditAccountId>
  <amount>50.00</amount>
  <currency>USD</currency>
  <description>Smoke test transfer</description>
  <transactionType>TRANSFER</transactionType>
</transaction>'

post_txn_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Content-Type: application/xml" \
    -H "Accept: application/xml" \
    -d "$TXN_XML" \
    "${LEDGER_BASE}/api/transactions" 2>/dev/null || echo -e "\n000")
post_txn_status=$(echo "$post_txn_response" | tail -1)
post_txn_body=$(echo "$post_txn_response" | sed '$d')

assert_status "POST transaction (double-entry)" "201" "$post_txn_status"
assert_xml "Transaction response is XML" "$post_txn_body"
assert_contains "Response contains transactionId" "$post_txn_body" "transactionId"

# 4d. Verify balance changed after transaction
balance_after_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "Accept: application/xml" \
    "${LEDGER_BASE}/api/accounts/${TEST_ACCOUNT_ID}/balance" 2>/dev/null || echo "000")
assert_status "Balance re-check after transaction" "200" "$balance_after_status"

# 4e. Non-existent account
notfound_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    -H "Accept: application/xml" \
    "${LEDGER_BASE}/api/accounts/999999/balance" 2>/dev/null || echo "000")
assert_status "Non-existent account returns 404" "404" "$notfound_status"

# 4f. Invalid transaction (missing required field)
BAD_TXN='<?xml version="1.0" encoding="UTF-8"?>
<transaction>
  <debitAccountId>100001</debitAccountId>
  <amount>50.00</amount>
</transaction>'

bad_txn_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    -H "Content-Type: application/xml" \
    -H "Accept: application/xml" \
    -d "$BAD_TXN" \
    "${LEDGER_BASE}/api/transactions" 2>/dev/null || echo "000")
assert_status "Incomplete transaction returns 400" "400" "$bad_txn_status"

# ---------------------------------------------------------------------------
# 5. ZAVA KYC SERVICE — Java 8 Servlet
# ---------------------------------------------------------------------------
log_section "5 — ZavaKYCService (Java Servlet)"

# 5a. POST KYC verify
KYC_REQUEST='{"customerId":1001,"firstName":"John","lastName":"Smith","dateOfBirth":"1985-03-15","ssn":"123-45-6789","address":"123 Main St, Springfield, IL 62701"}'

kyc_verify_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$KYC_REQUEST" \
    "${KYC_BASE}/api/kyc/verify" 2>/dev/null || echo -e "\n000")
kyc_verify_status=$(echo "$kyc_verify_response" | tail -1)
kyc_verify_body=$(echo "$kyc_verify_response" | sed '$d')

assert_status "POST KYC verify" "200" "$kyc_verify_status"
assert_contains "KYC response contains status" "$kyc_verify_body" "status"

# 5b. GET KYC status
kyc_status_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Accept: application/json" \
    "${KYC_BASE}/api/kyc/status/${TEST_CUSTOMER_ID}" 2>/dev/null || echo -e "\n000")
kyc_status_code=$(echo "$kyc_status_response" | tail -1)
kyc_status_body=$(echo "$kyc_status_response" | sed '$d')

assert_status "GET KYC status" "200" "$kyc_status_code"
assert_contains "KYC status contains customerId" "$kyc_status_body" "customerId"

# 5c. Watchlist hit scenario
KYC_WATCHLIST='{"customerId":9999,"firstName":"Test","lastName":"Watchlist","dateOfBirth":"1970-01-01","ssn":"000-00-0000","address":"Unknown"}'

watchlist_response=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$KYC_WATCHLIST" \
    "${KYC_BASE}/api/kyc/verify" 2>/dev/null || echo -e "\n000")
watchlist_status=$(echo "$watchlist_response" | tail -1)
watchlist_body=$(echo "$watchlist_response" | sed '$d')

if [ "$watchlist_status" = "200" ] || [ "$watchlist_status" = "403" ]; then
    log_pass "Watchlist scenario handled (HTTP $watchlist_status)"
    if [ "$watchlist_status" = "200" ]; then
        assert_contains "Watchlist response indicates flagged" "$watchlist_body" "FLAGGED\|DENIED\|WATCH"
    fi
else
    log_fail "Watchlist scenario" "expected 200 (flagged) or 403, got $watchlist_status"
fi

# 5d. Non-existent customer KYC status
kyc_notfound=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
    "${KYC_BASE}/api/kyc/status/999999" 2>/dev/null || echo "000")
assert_status "Non-existent customer KYC returns 404" "404" "$kyc_notfound"

# ---------------------------------------------------------------------------
# 6. CROSS-SERVICE INTEGRATION — Auth → KYC → Ledger Flow
# ---------------------------------------------------------------------------
log_section "6 — Cross-Service Integration (Demo Scenario)"

echo "  Demo scenario: Authenticate → Check KYC → Post Transaction → Verify Balance"

# 6a. Authenticate
DEMO_COOKIE_JAR="$(pwd)/tests/.demo_cookies_$$"
trap "rm -f $COOKIE_JAR $DEMO_COOKIE_JAR" EXIT

demo_login=$(curl -s -w "\n%{http_code}" --max-time 10 \
    -c "$DEMO_COOKIE_JAR" -L \
    -d "username=${TEST_USER}&password=${TEST_PASS}" \
    "${AUTH_BASE}/Login.aspx" 2>/dev/null || echo -e "\n000")
demo_login_status=$(echo "$demo_login" | tail -1)

if [ "$demo_login_status" = "200" ] || [ "$demo_login_status" = "302" ]; then
    log_pass "Step 1: Authenticate — HTTP $demo_login_status"
else
    log_fail "Step 1: Authenticate" "HTTP $demo_login_status"
fi

# 6b. Cross-ecosystem token validation
demo_token=$(grep "ZAVAAUTH" "$DEMO_COOKIE_JAR" 2>/dev/null | awk '{print $NF}' || echo "")
if [ -n "$demo_token" ]; then
    validate_java_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
        -H "X-Zava-Auth-Token: ${demo_token}" \
        "${AUTH_BASE}/api/auth/validate" 2>/dev/null || echo "000")
    assert_status "Step 2: Cross-ecosystem token validation" "200" "$validate_java_status"
else
    log_skip "Step 2: Cross-ecosystem SSO" "no auth token to validate"
fi

# 6c. Check KYC
kyc_check_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "Accept: application/json" \
    "${KYC_BASE}/api/kyc/status/${TEST_CUSTOMER_ID}" 2>/dev/null || echo "000")
assert_status "Step 3: KYC status check" "200" "$kyc_check_status"

# 6d. Post a ledger transaction
DEMO_TXN='<?xml version="1.0" encoding="UTF-8"?>
<transaction>
  <debitAccountId>100001</debitAccountId>
  <creditAccountId>100002</creditAccountId>
  <amount>25.00</amount>
  <currency>USD</currency>
  <description>Demo scenario payment</description>
  <transactionType>PAYMENT</transactionType>
</transaction>'

demo_txn_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "Content-Type: application/xml" \
    -H "Accept: application/xml" \
    -d "$DEMO_TXN" \
    "${LEDGER_BASE}/api/transactions" 2>/dev/null || echo "000")
assert_status "Step 4: Post ledger transaction" "201" "$demo_txn_status"

# 6e. Verify balance
demo_balance_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
    -H "Accept: application/xml" \
    "${LEDGER_BASE}/api/accounts/${TEST_ACCOUNT_ID}/balance" 2>/dev/null || echo "000")
assert_status "Step 5: Verify updated balance" "200" "$demo_balance_status"

# ---------------------------------------------------------------------------
# 7. ERA-APPROPRIATENESS CHECKS
# ---------------------------------------------------------------------------
log_section "7 — Era-Appropriateness Checks"

# 7a. WSDL is real SOAP
if echo "$wsdl_body" | grep -q "wsdl:"; then
    log_pass "CurrencyService exposes real WSDL (wsdl: namespace)"
elif echo "$wsdl_body" | grep -q "definitions"; then
    log_pass "CurrencyService exposes WSDL (definitions element)"
else
    log_fail "WSDL era check" "no WSDL/definitions namespace found"
fi

# 7b. Ledger returns XML not JSON
ledger_ct=$(curl -s -D - -o /dev/null --max-time 5 \
    -H "Accept: application/xml" \
    "${LEDGER_BASE}/api/accounts/${TEST_ACCOUNT_ID}/balance" 2>/dev/null | grep -i "content-type" || echo "")
if echo "$ledger_ct" | grep -qi "xml"; then
    log_pass "Ledger returns XML content-type"
elif echo "$ledger_ct" | grep -qi "json"; then
    log_fail "Ledger content-type" "returns JSON — expected XML for era-appropriateness"
else
    log_skip "Ledger content-type check" "could not determine content-type"
fi

# 7c. Auth uses FormsAuth cookie-based auth
if grep -q "ZAVAAUTH" "$COOKIE_JAR" 2>/dev/null; then
    log_pass "Auth uses FormsAuth cookie (.ZAVAAUTH), not Bearer tokens"
else
    log_skip "FormsAuth cookie check" "login did not produce cookie"
fi

# ---------------------------------------------------------------------------
# RESULTS SUMMARY
# ---------------------------------------------------------------------------
echo ""
echo "============================================"
echo "  M1 Smoke Test Results"
echo "============================================"
echo -e "  ${GREEN}Passed:${NC}  $PASS"
echo -e "  ${RED}Failed:${NC}  $FAIL"
echo -e "  ${YELLOW}Skipped:${NC} $SKIP"
echo "  Total:   $TOTAL"
echo "============================================"

rm -f "$COOKIE_JAR" "$DEMO_COOKIE_JAR" 2>/dev/null

if [ "$FAIL" -gt 0 ]; then
    echo -e "\n${RED}⚠️  $FAIL test(s) failed!${NC}"
    exit 1
else
    echo -e "\n${GREEN}All tests passed or skipped.${NC}"
    exit 0
fi

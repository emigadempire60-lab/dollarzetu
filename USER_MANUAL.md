# 📘 DollarZetu Complete User Manual
*A Step-by-Step Guide for Traders & Followers*

---

# PART 1: GUIDE (ADMIN / MASTER TRADER) MANUAL

## 🟢 Layman’s Language (Simple Terms)
Think of DollarZetu as a **megaphone for your trades**. 
Instead of texting your clients or telling them one by one *"Buy digit 7 now!"*, you click **one button** on your screen. Your trade is instantly copied to all your followers’ phones and laptops in a fraction of a second. 

**How you get paid**: Deriv pays you a commission every time your followers place a trade. Because 50 followers copy your trade at once instead of 1, your trade volume multiplies by 50, and so does your payout!

---

## 📈 Trader’s Language (Professional Terms)
DollarZetu is a **low-latency WebSocket signal broadcasting hub** for Deriv Synthetic Indices (`Volatility 10`, `25`, `50`, `75`, `100`).

Instead of single-account execution bottlenecked by web browser rate limits, DollarZetu routes your signal payload (`symbol`, `contractType`, `barrier`, `duration`, `recommendedStake`) via Server-Sent Events (SSE) and WebSockets. Each connected copier session places an independent `proposal` & `buy` API request on their own Deriv account at the exact same tick, generating scalable affiliate turnover commissions (up to 45% revenue share).

---

## 🛠️ Step-by-Step Guide for the Master Trader

### Step 1: Access Your Admin Broadcast Panel
1. Open your browser and navigate to your production URL: `https://yourdomain.com/admin`
2. Enter your Operator Password.

### Step 2: Set Up Your Trade Signal
On the **Master Signal Broadcaster** card:
1. **Synthetic Index**: Choose the market you are analyzing (e.g. `Volatility 100 Index`).
2. **Contract Type**: Pick your strategy:
   * **Matches / Differs** (Predicting exact last digit match/difference)
   * **Over / Under** (Predicting if last digit is higher or lower than barrier)
   * **Even / Odd** (Predicting if last digit is even or odd)
3. **Target Digit**: Select the target number (`0` to `9`).
4. **Ticks**: Set contract duration (usually `5` ticks).
5. **Rec. Stake ($)**: Set the recommended dollar amount for followers (e.g. `$10`).
6. **Optional Note**: Add a quick note for followers (e.g. *"High probability digit 7 pattern"*).

### Step 3: Broadcast the Signal
* Click the green **"🚀 BROADCAST SIGNAL TO ALL FOLLOWERS"** button.
* **What happens immediately**: The signal is broadcasted to all connected follower screens in milliseconds!

---

---

# PART 2: FOLLOWER (CLIENT / COPIER) MANUAL

## 🟢 Layman’s Language (Simple Terms)
DollarZetu lets you mirror professional trading signals automatically on your own Deriv account. 

You keep **100% control of your money**. You never give anyone your account password. You simply log in, turn on **Auto-Trade**, set how much money you want to bet per trade (e.g. `$5` or `$10`), and let the master trader's signals place the trades for you in real-time.

---

## 📈 Trader’s Language (Professional Terms)
DollarZetu is a **standalone digit trading terminal & client-side copy trader**. 

You retain full custody of your funds via Deriv OAuth / API Token scopes (`trade` permission). When connected to the Master Signal Feed, incoming signal packets trigger automated `proposal` quotes and `buy` executions directly against Deriv WebSocket servers within ~50ms of signal release.

---

## 🛠️ Step-by-Step Guide for Followers

### Step 1: Open the App & Log In
1. Visit the production app URL: `https://yourdomain.com`
2. Click **"Log In with Deriv"** (or click **"Sign Up"** to create a free Deriv account).

### Step 2: Configure Auto-Trade Signals
At the top of the main screen, you will see the **⚡ Master Signal Feed** box:
1. **Set Your Stake ($)**: Enter the dollar amount you want to risk per signal trade (e.g., `$5`).
2. **Toggle Auto-Trade ON**: Click the **"🤖 AUTO ON"** button.
   * *When Auto-Trade is ON*: Every signal sent by the master guide will execute on your account automatically without you having to press anything!
   * *When Auto-Trade is OFF*: You will receive real-time notifications and can manually click **"⚡ Copy Trade"** if you like the setup.

### Step 3: Manual Digits Trading (Optional)
Even if no signals are being broadcasted, you can use DollarZetu to trade on your own anytime:
* Watch the live **Digit Statistics Bar** (showing frequency of digits 0–9).
* Select your symbol, contract type, digit, and click **Buy Contract**.

### Step 4: Track Your Profits & Export Journal
* Scroll down to the **📊 Trading Performance Journal**.
* View your real-time **Net P&L**, **Win Rate %**, and **Peak Win Streak**.
* Click **"📥 Export CSV Journal"** anytime to download your complete trading history spreadsheet!

---

## ❓ Frequently Asked Questions (FAQ)

### Q1: Is my money safe?
**Yes.** The app never holds your funds. All money stays in your personal Deriv broker account. The app only sends trade commands to Deriv on your behalf.

### Q2: Do I have to keep my browser tab open?
For **Auto-Trade** to execute signals automatically, keep the DollarZetu webpage open on your phone or computer.

### Q3: What if I want to risk a different amount than the guide?
You can change your **Follower Stake ($)** in the signal feed box anytime! If the guide recommends `$50`, but your stake is set to `$5`, your account will only risk `$5`.

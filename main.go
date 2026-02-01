// Hackathon Starter: Complete AI Financial Agent
// Build intelligent financial tools with nim-go-sdk + Liminal banking APIs
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/becomeliminal/nim-go-sdk/core"
	"github.com/becomeliminal/nim-go-sdk/executor"
	"github.com/becomeliminal/nim-go-sdk/server"
	"github.com/becomeliminal/nim-go-sdk/tools"
	"github.com/joho/godotenv"
)

func main() {
	// ============================================================================
	// CONFIGURATION
	// ============================================================================
	// Load .env file if it exists (optional - will use system env vars if not found)
	_ = godotenv.Load()

	// Load configuration from environment variables
	// Create a .env file or export these in your shell

	anthropicKey := os.Getenv("ANTHROPIC_API_KEY")
	if anthropicKey == "" {
		log.Fatal("❌ ANTHROPIC_API_KEY environment variable is required")
	}

	liminalBaseURL := os.Getenv("LIMINAL_BASE_URL")
	if liminalBaseURL == "" {
		liminalBaseURL = "https://api.liminal.cash"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// ============================================================================
	// LIMINAL EXECUTOR SETUP
	// ============================================================================
	// The HTTPExecutor handles all API calls to Liminal banking services.
	// Authentication is handled automatically via JWT tokens passed from the
	// frontend login flow (email/OTP). No API key needed!

	liminalExecutor := executor.NewHTTPExecutor(executor.HTTPExecutorConfig{
		BaseURL: liminalBaseURL,
	})
	log.Println("✅ Liminal API configured")

	// ============================================================================
	// SERVER SETUP
	// ============================================================================
	// Create the nim-go-sdk server with Claude AI
	// The server handles WebSocket connections and manages conversations
	// Authentication is automatic: JWT tokens from the login flow are extracted
	// from WebSocket connections and forwarded to Liminal API calls

	srv, err := server.New(server.Config{
		AnthropicKey:    anthropicKey,
		SystemPrompt:    hackathonSystemPrompt,
		Model:           "claude-sonnet-4-20250514",
		MaxTokens:       4096,
		LiminalExecutor: liminalExecutor, // SDK automatically handles JWT extraction and forwarding
	})
	if err != nil {
		log.Fatal(err)
	}

	// ============================================================================
	// ADD LIMINAL BANKING TOOLS
	// ============================================================================
	// These are the 9 core Liminal tools that give your AI access to real banking:
	//
	// READ OPERATIONS (no confirmation needed):
	//   1. get_balance - Check wallet balance
	//   2. get_savings_balance - Check savings positions and APY
	//   3. get_vault_rates - Get current savings rates
	//   4. get_transactions - View transaction history
	//   5. get_profile - Get user profile info
	//   6. search_users - Find users by display tag
	//
	// WRITE OPERATIONS (require user confirmation):
	//   7. send_money - Send money to another user
	//   8. deposit_savings - Deposit funds into savings
	//   9. withdraw_savings - Withdraw funds from savings

	srv.AddTools(tools.LiminalTools(liminalExecutor)...)
	log.Println("✅ Added 9 Liminal banking tools")

	// ============================================================================
	// ADD CUSTOM TOOLS
	// ============================================================================
	// This is where you'll add your hackathon project's custom tools!
	// Below is an example spending analyzer tool to get you started.

	srv.AddTool(createSpendingAnalyzerTool(liminalExecutor))
	log.Println("✅ Added custom spending analyzer tool")

	// TODO: Add more custom tools here!
	// Examples:
	//   - Savings goal tracker
	//   - Budget alerts
	//   - Spending category analyzer
	//   - Bill payment predictor
	//   - Cash flow forecaster

	// ============================================================================
	// START SERVER
	// ============================================================================

	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("🚀 Hackathon Starter Server Running")
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Printf("📡 WebSocket endpoint: ws://localhost:%s/ws", port)
	log.Printf("💚 Health check: http://localhost:%s/health", port)
	log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Println("Ready for connections! Start your frontend with: cd frontend && npm run dev")
	log.Println()

	if err := srv.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================
// This prompt defines your AI agent's personality and behavior
// Customize this to match your hackathon project's focus!

const hackathonSystemPrompt = `You are Nim, a friendly AI financial assistant built for the Liminal Vibe Banking Hackathon.

WHAT YOU DO:
You help users manage their money using Liminal's stablecoin banking platform. You can check balances, review transactions, send money, and manage savings - all through natural conversation.

CONVERSATIONAL STYLE:
- Be warm, friendly, and conversational - not robotic
- Use casual language when appropriate, but stay professional about money
- Ask clarifying questions when something is unclear
- Remember context from earlier in the conversation
- Explain things simply without being condescending

WHEN TO USE TOOLS:
- Use tools immediately for simple queries ("what's my balance?")
- For actions, gather all required info first ("send $50 to @alice")
- Always confirm before executing money movements
- Don't use tools for general questions about how things work

MONEY MOVEMENT RULES (IMPORTANT):
- ALL money movements require explicit user confirmation
- Show a clear summary before confirming:
  * send_money: "Send $50 USD to @alice"
  * deposit_savings: "Deposit $100 USD into savings"
  * withdraw_savings: "Withdraw $50 USD from savings"
- Never assume amounts or recipients
- Always use the exact currency the user specified

AVAILABLE BANKING TOOLS:
- Check wallet balance (get_balance)
- Check savings balance and APY (get_savings_balance)
- View savings rates (get_vault_rates)
- View transaction history (get_transactions)
- Get profile info (get_profile)
- Search for users (search_users)
- Send money (send_money) - requires confirmation
- Deposit to savings (deposit_savings) - requires confirmation
- Withdraw from savings (withdraw_savings) - requires confirmation

CUSTOM ANALYTICAL TOOLS:
- Analyze spending patterns (analyze_spending)

TIPS FOR GREAT INTERACTIONS:
- Proactively suggest relevant actions ("Want me to move some to savings?")
- Explain the "why" behind suggestions
- Celebrate financial wins ("Nice! Your savings earned $5 this month!")
- Be encouraging about savings goals
- Make finance feel less intimidating

Remember: You're here to make banking delightful and help users build better financial habits!`

// ============================================================================
// CUSTOM TOOL: SPENDING ANALYZER
// ============================================================================
// This is an example custom tool that demonstrates how to:
// 1. Define tool parameters with JSON schema
// 2. Call other Liminal tools from within your tool
// 3. Process and analyze the data
// 4. Return useful insights
//
// Use this as a template for your own hackathon tools!

func createSpendingAnalyzerTool(liminalExecutor core.ToolExecutor) core.Tool {
	return tools.New("analyze_spending").
		Description("Analyze the user's spending patterns over a specified time period. Returns insights about spending velocity, categories, and trends.").
		Schema(tools.ObjectSchema(map[string]interface{}{
			"days": tools.IntegerProperty("Number of days to analyze (default: 30)"),
		})).
		Handler(func(ctx context.Context, toolParams *core.ToolParams) (*core.ToolResult, error) {
			// Parse input parameters
			var params struct {
				Days int `json:"days"`
			}
			if err := json.Unmarshal(toolParams.Input, &params); err != nil {
				return &core.ToolResult{
					Success: false,
					Error:   fmt.Sprintf("invalid input: %v", err),
				}, nil
			}

			// Default to 30 days if not specified
			if params.Days == 0 {
				params.Days = 30
			}

			// STEP 1: Fetch transaction history
			// We'll call the Liminal get_transactions tool through the executor
			txRequest := map[string]interface{}{
				"limit": 100, // Get up to 100 transactions
			}
			txRequestJSON, _ := json.Marshal(txRequest)

			txResponse, err := liminalExecutor.Execute(ctx, &core.ExecuteRequest{
				UserID:    toolParams.UserID,
				Tool:      "get_transactions",
				Input:     txRequestJSON,
				RequestID: toolParams.RequestID,
			})
			if err != nil {
				return &core.ToolResult{
					Success: false,
					Error:   fmt.Sprintf("failed to fetch transactions: %v", err),
				}, nil
			}

			if !txResponse.Success {
				return &core.ToolResult{
					Success: false,
					Error:   fmt.Sprintf("transaction fetch failed: %s", txResponse.Error),
				}, nil
			}

			// STEP 2: Parse transaction data
			// In a real implementation, you'd parse the actual response structure
			// For now, we'll create a structured analysis

			var transactions []map[string]interface{}
			var txData map[string]interface{}
			if err := json.Unmarshal(txResponse.Data, &txData); err == nil {
				if txArray, ok := txData["transactions"].([]interface{}); ok {
					for _, tx := range txArray {
						if txMap, ok := tx.(map[string]interface{}); ok {
							transactions = append(transactions, txMap)
						}
					}
				}
			}

			// STEP 3: Analyze the data
			analysis := analyzeTransactions(transactions, params.Days)

			// STEP 4: Return insights
			result := map[string]interface{}{
				"period_days":        params.Days,
				"total_transactions": len(transactions),
				"analysis":           analysis,
				"generated_at":       time.Now().Format(time.RFC3339),
			}

			return &core.ToolResult{
				Success: true,
				Data:    result,
			}, nil
		}).
		Build()
}

// analyzeTransactions processes transaction data and returns insights
func analyzeTransactions(transactions []map[string]interface{}, days int) map[string]interface{} {
	if len(transactions) == 0 {
		return map[string]interface{}{
			"summary": "No transactions found in the specified period",
		}
	}

	// Calculate basic metrics
	var totalSpent, totalReceived float64
	var spendCount, receiveCount int

	// This is a simplified example - you'd do real analysis here:
	// - Group by category/merchant
	// - Calculate daily/weekly averages
	// - Identify spending spikes
	// - Compare to previous periods
	// - Detect recurring payments

	for _, tx := range transactions {
		// Example analysis logic
		txType, _ := tx["type"].(string)
		amount, _ := tx["amount"].(float64)

		switch txType {
		case "send":
			totalSpent += amount
			spendCount++
		case "receive":
			totalReceived += amount
			receiveCount++
		}
	}

	avgDailySpend := totalSpent / float64(days)

	return map[string]interface{}{
		"total_spent":     fmt.Sprintf("%.2f", totalSpent),
		"total_received":  fmt.Sprintf("%.2f", totalReceived),
		"spend_count":     spendCount,
		"receive_count":   receiveCount,
		"avg_daily_spend": fmt.Sprintf("%.2f", avgDailySpend),
		"velocity":        calculateVelocity(spendCount, days),
		"insights": []string{
			fmt.Sprintf("You made %d spending transactions over %d days", spendCount, days),
			fmt.Sprintf("Average daily spend: $%.2f", avgDailySpend),
			"Consider setting up savings goals to build financial cushion",
		},
	}
}

// calculateVelocity determines spending frequency
func calculateVelocity(transactionCount, days int) string {
	txPerWeek := float64(transactionCount) / float64(days) * 7

	switch {
	case txPerWeek < 2:
		return "low"
	case txPerWeek < 7:
		return "moderate"
	default:
		return "high"
	}
}

func createSubscriptionAnalyzerTool(liminalExecuter core.ToolExecuter) core.Tool {
	return tools.New("analyze_subscriptions").
		Description("Scan Transaction History to identify recurring subscriptions and recurring payments. Returns subscription patters, total month costs, and cancellation insights.").
		Schema(tools.ObjectScema(map[string]interface{}{
			"timeframe_months": tools.IntegerProperty("Number of months to analyze for recurring patterns (default:6)"),
			"min_amount": tools.NumberProperty("Minimum amount to be considered as subscription (default: 1.00)"),
			"max_amount": tools.NumberProperty("Maximum amount to be considered as a subscription (default: 999.99)"),	
		}))
		Handler(func(ctx context.Context, toolParams *core.ToolExecutor) (*core.ToolResult, error){
			var params struct {
				TimeframeMonths int     `json:"timeframe_months"`
				MinAmount       float64 `json:"min_amount"`
				MaxAmount       float64 `json:"max_amount"`
			}
			if err:== json.Unmarshal(toolParams.input, &params); err != nil{
				return &core.ToolResult{
					Success: false,
					Error: fmt.Sprintf("invalid input: %v", err),

				}, nil
			}
			//set defaults
			if params.TimeframeMonths == 0{
				params.TimeframeMonths = 6
			}
			if params.MinAmount ==0 {
				params.MinAmount = 1.00
			}
			if params.MaxAmount == 0 {
				params.MaxAmount = 999.99
			}
			//calc date range
			now := time.Now()
			cutoffDate := now.AddDate(0, -params.TimeframeMonths, 0)

			txRequest:= map[string]interface{}{
				"limit": 500,
				"start_date": cutoffDate.Format("2006-01-02"),

			}
			txRequestJSON, _ := json.Marshal(txRequest)
			txResponse, err := liminalExecutor.Execute(ctx, &core.ExecuteRequest{
				UserID: toolParams.UserID,
				Tool: "get_transactions",
				Input: txRequestJSON,
				RequestID: toolParams.RequestID,

			})
			if err != nil {
				return %core.ToolResult{
					Success: false,
					Error: fmt.Sprintf("failed to fetch transactions: %v", err),

				}
			}
			if !txResponse.Success{
				return &core.ToolResult{
					Success: false,
					Error: fmt.Sprintf("transaction fetch failed :%s", txResponse.Error),

				}, nil
			}
			var transactions []map[string]interface{}
			var txData map[string]interface{}
			if err != json.Unmarshal(txResponse.Data, %txData); err==nil{
				if txArray,ok := txData["transactions"].([]interface{}); ok {
					for _, tx := range txArray{
						if txMap, ok := tx.(map[string]interface{};) ok {
							transactions = append(transactions, txMap)
						}
					}
				}
			}
			subscriptions := analyzeForSubscriptions(transactions, cutoffDate, params.MinAmount, params.MaxAmount)
			result := map[string]interface{}{
				"analysis_period": fmt.Sprintf("%d months", Params.TimeframeMonths),
				"total_transactions_scanned": len(transactions),
				"subscriptions_found": len(subscriptions),
				"subscriptions": subscriptions,
				"total_monthly_cost": calculateTotalMonthlyCost(subscriptions),
				"warnings": generateWarnings(subscriptions)
				"generated_at": now.Format(time.RFC3339),
			}
			return &core.ToolResult {
				Success: true,
				Data: result,
			}, nil

		}).
		build()
}

func analyzeForSubscriptions(transactions []map[string]interface{}, cutoffDate time.Time, minAmount, maxAmount float64) []map[string]interface{}{
	if len(transactions) == 0{
		return []map[string]interface{}{}

	}
	type paymentKey struct {
		merchant string
		amount string
	}
	paymentGroups := make(map[paymentKey][]time.Time)
	for _, tx := range transactions {
		txType, _ := tx["type"].(string)
		if txType != "send" {
			continue
		}
		amount, _ := tx["amount"].(float64)
		if amount <minAmount || amount > maxAmount {
			continue
		}
		merchant := "Unknown"
		if desc, ok := tx["description"].(string); ok && desc != "" {
			merchant = desc
		} else if recipient, ok := tx["recipient"].(string); ok && recipient!= ""{
			merchant = recipient
		}
		txDateStr, ok := tx["date"].(string)
		if !ok {
			continue
		}
		txDate, err := time.Parse(time.RFC3339, txDateStr)
		if err != nil {
			continue
		}
		if txDate.Before(cutoffDate) {
			continue
		}
		roundedAmount := fmt.Sprintf("%.2f", amount)
		key := paymentKey{merchant: merchant,amount:roundedAmount}
		paymentGroups[key] = append(paymentGroups[key], txDate)

		
	}
	var Subscriptions []map[string]interface{}
	for key, dates := range paymentGroups {
		if len(dates) <2 {
			continue
		}
		sort.Slice(dates, func(i,j int) bool {
			return dates[i].Before(dates[j])
		})
		intervals := make([]int, 0)
		for i := 1; i < len(dates); i++{
			daysBetween := int(dates[i]. Sub(dates[i-1]).Hours()/24)
			intervals = append(intervals,daysBetween)
		}
		if isRegularPattern(intervals) {
			amount, _ := strconv.ParseFloat(key.amount, 64)
			frequency := detectFrequency(intervals)
			subscription:= map[string]interface{}{
				"merchant": key.merchant,
				"amount": amount,
				"frequency": frequency,
				"occurences": len(dates),
				"last_occurence": dates[len(dates_-1)].Format("2006-01-02"),
				"estimated_next": estimateNextPayment(dates[len(dates)-1], frequency),
				"total_paid": amount * float64(len(dates)),
				"confidence": calcualteConfidence(len(dates), intervals),

			}
			subscriptions = append(subscriptions, subscription)
		}
	}
	return subscriptions
}

func isRegularPattern(intervals []int) bool{
	if len(intervals) == 0 {
		return false
	}
	sum := 0
	for_, interval := range intervals {
		sum += interval
	}
	avg := float(sum) / float64(len(intervals))
	withinTolerance := 0
	tolerance := avg * 0.2
	for_, interval := range intervals {
		if math.Abs(float64(interval)-avg) <= tolerance {
			withinTolerance++
		}
	}
	return float64(withinTolerance)/float64(len(intervals)) >= 0.7

}

func detectFrequency(intervals []int) string{
	if len(intervals) == 0{
		return "unknown"
	}
	sum:= 0
	for _, interval := range intervals {
		sum += interval
	}
	avgDays := float64(sum)/float64(len(intervals))
	switch{
	case avgDays >= 25 && avgDays <= 35:
		return "monthly"
	case avgDays >= 80 && avgDays <= 100:
		return "quarterly"
	case avgDays >= 170 && avgDays <= 190:
		return "semi-annual"
	case avgDays >= 350 && avgDays <= 380:
		return "annual"
	case avgDays >= 7 && avgDays <= 14:
		return "biweekly"
	case avgDays >= 1 && avgDays <= 7:
		return "week"
	default:
		return: "irregular"
	}
}

func estimateNextPayment(lastPayment time.Time, frequency string) string{
	switch frequency {
	case "monthly":
		return lastpayment.AddDate(0,1,0).format("2006-01-02")
	case "quarterly":
		return lastpayment.AddDate(0,3,0).format("2006-01-02")
	case "semi-annual":
		return lastpayment.AddDate(0,6,0).format("2006-01-02")
	case "annual":
		return lastpayment.AddDate(1,0,0).format("2006-01-02")
	case "bi-weekly":
		return lastpayment.AddDate(0,0,14).format("2006-01-02")
	case "weekly":
		return lastpayment.AddDate(0,0,7).format("2006-01-02")
	default:
		return:"unknown"
	}
}

func calcualteConfidence(occurences int, intervals[]int) string {
	if occurences >= 4 && isRegularPattern(intervals){
		return "high"
	} else if occurences >= 3{
		return"medium"
	} else{
		return"low"
	}

}

func calculateTotalMonthlyCost(subscriptions []map[string]interface{}) float64 {
	var totalMonthly float64
	for _, sub:= range subscriptions{
		amount,_ := sub["amount"].(float64)
		frequency, _ := sub["frequency"].(string)
		switch frequency{
		case "monthly":
			totalMonthly += amount
		case "quarterly":
			totalMonthly += amount/3
		case "semi-annual":
			totalMonthly += amount/6
		case "annual":
			totalMonthly += amount/12			
		case "bi-weekly":
			totalMonthly += amount*2.167
		case "weekly":
			totalMonthly += amount*4.333
		}
	}
	return math.Round(totalMonthly*100)/100
}

func generateWarnings(subscription []map[string]interface{}) []string {
	warnings :- make([]string, 0)
	if len(subscriptions) == 0 {
		warnings = append(warnings, "No subscriptions were detected at all in your transaction history.")
		return warnings
	}
	totalMonthly := calculateTotalMonthlyCost(subscriptions)
	warnings = append(warnings,fmt.Sprintf("You are spending approximately $%.2f per month on subscriptions.", totalMonthly))
	merchantCategories := make(map[string][]string)
	knownPatterns:= map[string][]string{
		"streaming": {"netflix","hulu","disney","prime","spotify","hbo","apple tv", "youtube premium"},
		"music": {"spotify", "apply music", "youtube music", "tidal", "pandora"},
		"cloud": {"dropbox", "google one",  "icloud", "onedrive"},
		"fitness": {"peloton", "classpass", "apple fitness", "strava"},
	}
	for _, sub := range subscriptions{
		merchant, _ := sub["merchant"].(string)
		merchantLower := strings.ToLower(merchant)
		for category, keyworkds := rnage knownPatterns {
			for _, keyword := range keywords {
				if strings.Contains(merchantLower, keyword){
					merchantCategories[category] = append(merchantCategories[category], merchant)
					break
				}

			}
		}
		
	}
	for category, merchants := range merchantCategories {
		if len(merchants) >1 {
			warnings = append(warnings, fmt.Sprintf("you have multiple %s subscriptions. %s Consider consolidating.", category, strings.Join(merchants, ",")))
		}
	}
	now := time.Now()
	for _, sub := range subscriptions {
		occurences, _ := sub["occurences"].(int)
		lastDatestr, _ := sub["last_occurence"].(string)
		lastDate, err := time.Parse("2006-01-02", lastDatestr)
		if err == nil && occurences <3 && now.Sub(lastDate).hours()/24 >90{
			merchant, _ := sub["merchant"].(string)
			warnings = append(warnings,fmt.Sprintf("Subscription to '%s' seems inactive (last paid %s). Consider cancelling if you no longer use.", merchant, lastDatestr))

		}
	}
	if totalMonthly > 50{
		savings := math.Round(totalMonthly*0.1*100)/100
		warnings = append(warnings,fmt.Sprintf("Tip: Cancelling just 10%% of your subscriptions can possibly save you $%.2f monthly!", savings))

	}
	return warnings
}
// ============================================================================
// HACKATHON IDEAS
// ============================================================================
// Here are some ideas for custom tools you could build:
//
// 1. SAVINGS GOAL TRACKER
//    - Track progress toward savings goals
//    - Calculate how long until goal is reached
//    - Suggest optimal deposit amounts
//
// 2. BUDGET ANALYZER
//    - Set spending limits by category
//    - Alert when approaching limits
//    - Compare actual vs. planned spending
//
// 3. RECURRING PAYMENT DETECTOR
//    - Identify subscription payments
//    - Warn about upcoming bills
//    - Suggest savings opportunities
//
// 4. CASH FLOW FORECASTER
//    - Predict future balance based on patterns
//    - Identify potential low balance periods
//    - Suggest when to save vs. spend
//
// 5. SMART SAVINGS ADVISOR
//    - Analyze spare cash available
//    - Recommend savings deposits
//    - Calculate interest projections
//
// 6. SPENDING INSIGHTS
//    - Categorize spending automatically
//    - Compare to typical user patterns
//    - Highlight unusual activity
//
// 7. FINANCIAL HEALTH SCORE
//    - Calculate overall financial wellness
//    - Track improvements over time
//    - Provide actionable recommendations
//
// 8. PEER COMPARISON (anonymous)
//    - Compare savings rate to anonymized peers
//    - Show percentile rankings
//    - Motivate better habits
//
// 9. TAX ESTIMATION
//    - Track potential tax obligations
//    - Suggest amounts to set aside
//    - Generate tax reports
//
// 10. EMERGENCY FUND BUILDER
//     - Calculate needed emergency fund size
//     - Track progress toward goal
//     - Suggest automated savings plan
//
// ============================================================================

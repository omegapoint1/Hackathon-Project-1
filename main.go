
// Hackathon Starter: Complete AI Financial Agent
// Build intelligent financial tools with nim-go-sdk + Liminal banking APIs
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"os"
	"sort"
	"strconv"
	"strings"
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
	_ = godotenv.Load()

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

	useMock := os.Getenv("USE_MOCK") == "true"

	// ============================================================================
	// SERVER SETUP
	// ============================================================================
	// In mock mode we omit LiminalExecutor from the config entirely — the SDK
	// only needs it to forward JWTs to the real Liminal API, which we skip.

	cfg := server.Config{
		AnthropicKey: anthropicKey,
		SystemPrompt: hackathonSystemPrompt,
		Model:        "claude-sonnet-4-20250514",
		MaxTokens:    4096,
	}

	if !useMock {
		httpExec := executor.NewHTTPExecutor(executor.HTTPExecutorConfig{
			BaseURL: liminalBaseURL,
		})
		cfg.LiminalExecutor = httpExec
		log.Println("✅ Liminal API configured (live)")
	} else {
		log.Println("✅ Using MOCK executor (USE_MOCK=true)")
	}

	srv, err := server.New(cfg)
	if err != nil {
		log.Fatal(err)
	}

	// ============================================================================
	// ADD BANKING TOOLS
	// ============================================================================

	if useMock {
		// Register all 9 tools manually via the tools.New() builder so we never
		// touch the concrete *executor.HTTPExecutor type.
		srv.AddTools(mockLiminalTools()...)
		log.Println("✅ Added 9 mock Liminal banking tools")
	} else {
		srv.AddTools(tools.LiminalTools(cfg.LiminalExecutor)...)
		log.Println("✅ Added 9 Liminal banking tools")
	}

	// ============================================================================
	// ADD CUSTOM TOOLS
	// ============================================================================
	// The custom tools accept core.ToolExecutor (interface).  In mock mode we
	// pass a *mockExecutor; in live mode we pass the HTTPExecutor (which also
	// satisfies the interface).

	var customExec core.ToolExecutor
	if useMock {
		customExec = &mockExecutor{}
	} else {
		customExec = cfg.LiminalExecutor
	}

	srv.AddTool(createSpendingAnalyzerTool(customExec))
	log.Println("✅ Added custom spending analyzer tool")

	srv.AddTool(createSubscriptionAnalyzerTool(customExec))
	log.Println("✅ Added custom subscription analyzer tool")

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
// MOCK EXECUTOR  –  satisfies core.ToolExecutor for the custom analyzer tools
// ============================================================================

type mockExecutor struct{}

var _ core.ToolExecutor = (*mockExecutor)(nil)

// READ EXECUTION (safe tools: get_balance, get_transactions, etc.)
func (m *mockExecutor) Execute(
	_ context.Context,
	req *core.ExecuteRequest,
) (*core.ExecuteResponse, error) {
	return m.runMockTool(req)
}

// WRITE EXECUTION (money-moving tools: send_money, deposit, withdraw)
func (m *mockExecutor) ExecuteWrite(
	_ context.Context,
	req *core.ExecuteRequest,
) (*core.ExecuteResponse, error) {
	return m.runMockTool(req)
}

// Shared tool router
func (m *mockExecutor) runMockTool(
	req *core.ExecuteRequest,
) (*core.ExecuteResponse, error) {

	var result *core.ToolResult
	var err error

	switch req.Tool {

	// ---------- READ ----------
	case "get_balance":
		result, err = mockGetBalance()

	case "get_savings_balance":
		result, err = mockGetSavingsBalance()

	case "get_vault_rates":
		result, err = mockGetVaultRates()

	case "get_transactions":
		result, err = mockGetTransactions(req.Input)

	case "get_profile":
		result, err = mockGetProfile()

	case "search_users":
		result, err = mockSearchUsers()

	// ---------- WRITE ----------
	case "send_money":
		result, err = mockSendMoney(req.Input)

	case "deposit_savings":
		result, err = mockDepositSavings(req.Input)

	case "withdraw_savings":
		result, err = mockWithdrawSavings(req.Input)

	default:
		result = &core.ToolResult{
			Success: false,
			Error:   fmt.Sprintf("mock: unknown tool %q", req.Tool),
		}
	}

	if err != nil {
		return nil, err
	}

	// ToolResult.Data is already []byte from json.Marshal
	raw, ok := result.Data.(json.RawMessage)
	if !ok {
		// If it's actually []byte, convert safely
		if b, ok2 := result.Data.([]byte); ok2 {
			raw = json.RawMessage(b)
		} else {
			raw = json.RawMessage(`{}`)
		}
	}

	return &core.ExecuteResponse{
		Success: result.Success,
		Error:   result.Error,
		Data:    raw,
	}, nil
}

// CANCEL
func (m *mockExecutor) Cancel(
	_ context.Context,
	_ string,
	_ string,
) error {
	return nil
}

// CONFIRM
func (m *mockExecutor) Confirm(
	_ context.Context,
	_ string,
	_ string,
) (*core.ExecuteResponse, error) {
	return &core.ExecuteResponse{
		Success: true,
		Data:    json.RawMessage(`{"confirmed": true}`),
	}, nil
}

// ============================================================================
// MOCK TOOL REGISTRATION  –  the 9 Liminal tools built with tools.New()
// ============================================================================

func mockLiminalTools() []core.Tool {
	return []core.Tool{
		tools.New("get_balance").
			Description("Check the user's current wallet balance.").
			Schema(tools.ObjectSchema(map[string]interface{}{})).
			Handler(func(_ context.Context, _ *core.ToolParams) (*core.ToolResult, error) {
				return mockGetBalance()
			}).Build(),

		tools.New("get_savings_balance").
			Description("Check the user's savings balance and APY.").
			Schema(tools.ObjectSchema(map[string]interface{}{})).
			Handler(func(_ context.Context, _ *core.ToolParams) (*core.ToolResult, error) {
				return mockGetSavingsBalance()
			}).Build(),

		tools.New("get_vault_rates").
			Description("Get current savings vault rates and APY.").
			Schema(tools.ObjectSchema(map[string]interface{}{})).
			Handler(func(_ context.Context, _ *core.ToolParams) (*core.ToolResult, error) {
				return mockGetVaultRates()
			}).Build(),

		tools.New("get_transactions").
			Description("View the user's transaction history.").
			Schema(tools.ObjectSchema(map[string]interface{}{
				"limit":      tools.IntegerProperty("Max number of transactions to return (default: 20)"),
				"start_date": tools.StringProperty("Filter transactions after this date (YYYY-MM-DD)"),
			})).
			Handler(func(_ context.Context, tp *core.ToolParams) (*core.ToolResult, error) {
				return mockGetTransactions(tp.Input)
			}).Build(),

		tools.New("get_profile").
			Description("Get the user's profile information.").
			Schema(tools.ObjectSchema(map[string]interface{}{})).
			Handler(func(_ context.Context, _ *core.ToolParams) (*core.ToolResult, error) {
				return mockGetProfile()
			}).Build(),

		tools.New("search_users").
			Description("Search for users by display tag.").
			Schema(tools.ObjectSchema(map[string]interface{}{
				"query": tools.StringProperty("The user tag or name to search for"),
			})).
			Handler(func(_ context.Context, _ *core.ToolParams) (*core.ToolResult, error) {
				return mockSearchUsers()
			}).Build(),

		tools.New("send_money").
			Description("Send money to another user. Requires confirmation.").
			Schema(tools.ObjectSchema(map[string]interface{}{
				"recipient": tools.StringProperty("Recipient user tag (e.g. @alice)"),
				"amount":    tools.NumberProperty("Amount to send"),
				"currency":  tools.StringProperty("Currency code (default: USD)"),
			})).
			Handler(func(_ context.Context, tp *core.ToolParams) (*core.ToolResult, error) {
				return mockSendMoney(tp.Input)
			}).Build(),

		tools.New("deposit_savings").
			Description("Deposit funds into savings. Requires confirmation.").
			Schema(tools.ObjectSchema(map[string]interface{}{
				"amount":   tools.NumberProperty("Amount to deposit"),
				"currency": tools.StringProperty("Currency code (default: USD)"),
			})).
			Handler(func(_ context.Context, tp *core.ToolParams) (*core.ToolResult, error) {
				return mockDepositSavings(tp.Input)
			}).Build(),

		tools.New("withdraw_savings").
			Description("Withdraw funds from savings. Requires confirmation.").
			Schema(tools.ObjectSchema(map[string]interface{}{
				"amount":   tools.NumberProperty("Amount to withdraw"),
				"currency": tools.StringProperty("Currency code (default: USD)"),
			})).
			Handler(func(_ context.Context, tp *core.ToolParams) (*core.ToolResult, error) {
				return mockWithdrawSavings(tp.Input)
			}).Build(),
	}
}

// ============================================================================
// MOCK RESPONSES  –  match frontend mockBankingData.ts exactly
// ============================================================================

func mockGetBalance() (*core.ToolResult, error) {
	return toToolResult(map[string]interface{}{
		"balance":  2847.50,
		"currency": "USD",
	})
}

func mockGetSavingsBalance() (*core.ToolResult, error) {
	return toToolResult(map[string]interface{}{
		"balance":  15420.30,
		"currency": "USD",
		"apy":      4.5,
		"positions": []map[string]interface{}{
			{"vault_id": "vault_usd_1", "balance": 15420.30, "apy": 4.5},
		},
	})
}

func mockGetVaultRates() (*core.ToolResult, error) {
	return toToolResult(map[string]interface{}{
		"rates": []map[string]interface{}{
			{"vault_id": "vault_usd_1", "apy": 4.5, "currency": "USD"},
		},
	})
}

func mockGetProfile() (*core.ToolResult, error) {
	return toToolResult(map[string]interface{}{
		"id":         "user_mock_123",
		"email":      "demo@liminal.cash",
		"name":       "Demo User",
		"created_at": time.Now().AddDate(0, 0, -90).Format(time.RFC3339),
		"verified":   true,
	})
}

func mockSearchUsers() (*core.ToolResult, error) {
	return toToolResult(map[string]interface{}{
		"users": []map[string]interface{}{
			{"id": "user_mock_456", "name": "Alice", "tag": "@alice"},
		},
	})
}

// ---------------------------------------------------------------------------
// transactions  –  same templates & variance logic as the TS mock
// ---------------------------------------------------------------------------

var mockTxTemplates = []struct {
	Description string
	Amount      float64
	Type        string // send | receive | deposit | withdrawal
}{
	{"Starbucks Coffee", 8.50, "send"},
	{"Chipotle Mexican Grill", 15.75, "send"},
	{"Whole Foods Market", 67.30, "send"},
	{"DoorDash - Pizza Delivery", 32.50, "send"},
	{"Local Coffee Shop", 6.25, "send"},
	{"Uber Ride", 18.50, "send"},
	{"Gas Station", 45.00, "send"},
	{"Lyft Ride", 22.75, "send"},
	{"Metro Card Reload", 30.00, "send"},
	{"Amazon.com", 89.99, "send"},
	{"Target Store", 54.25, "send"},
	{"Nike Store", 125.00, "send"},
	{"Netflix Subscription", 15.99, "send"},
	{"Spotify Premium", 10.99, "send"},
	{"Movie Theater", 28.50, "send"},
	{"Steam Games", 59.99, "send"},
	{"Electric Bill Payment", 125.50, "send"},
	{"Internet Service", 79.99, "send"},
	{"Phone Bill", 65.00, "send"},
	{"Payroll Deposit", 2500.00, "receive"},
	{"Freelance Payment", 450.00, "receive"},
	{"Refund from Amazon", 29.99, "receive"},
	{"Payment from @alice", 75.00, "receive"},
	{"Savings Deposit", 200.00, "deposit"},
	{"Savings Withdrawal", 100.00, "withdrawal"},
}

func mockGetTransactions(input json.RawMessage) (*core.ToolResult, error) {
	var params struct {
		Limit     int    `json:"limit"`
		StartDate string `json:"start_date"`
	}
	_ = json.Unmarshal(input, &params)
	if params.Limit == 0 {
		params.Limit = 20
	}

	r := rand.New(rand.NewSource(42)) // fixed seed → deterministic every time
	now := time.Now()

	var cutoff time.Time
	if params.StartDate != "" {
		if t, err := time.Parse("2006-01-02", params.StartDate); err == nil {
			cutoff = t
		}
	}

	type tx struct {
		ID           string  `json:"id"`
		Amount       float64 `json:"amount"`
		Currency     string  `json:"currency"`
		Type         string  `json:"type"`
		Status       string  `json:"status"`
		Description  string  `json:"description"`
		Date         string  `json:"date"`
		CreatedAt    string  `json:"created_at"`
		Counterparty string  `json:"counterparty,omitempty"`
	}

	var txs []tx
	for i := 0; i < 40 && len(txs) < params.Limit; i++ {
		tmpl := mockTxTemplates[r.Intn(len(mockTxTemplates))]
		daysAgo := r.Intn(30)
		createdAt := now.AddDate(0, 0, -daysAgo)

		if !cutoff.IsZero() && createdAt.Before(cutoff) {
			continue
		}

		// 80–120 % variance, same as TS mock
		variance := 0.8 + r.Float64()*0.4
		amount := math.Round(tmpl.Amount*variance*100) / 100

		cp := ""
		if tmpl.Type == "receive" && r.Float64() > 0.5 {
			cp = "@alice"
		}

		txs = append(txs, tx{
			ID:           fmt.Sprintf("tx_mock_%d_%d", i, now.UnixMilli()),
			Amount:       amount,
			Currency:     "USD",
			Type:         tmpl.Type,
			Status:       "completed",
			Description:  tmpl.Description,
			Date:         createdAt.Format(time.RFC3339),
			CreatedAt:    createdAt.Format(time.RFC3339),
			Counterparty: cp,
		})
	}

	return toToolResult(map[string]interface{}{
		"transactions": txs,
		"total":        len(txs),
	})
}

// ---------------------------------------------------------------------------
// write operations  –  echo back a completed transaction
// ---------------------------------------------------------------------------

func mockSendMoney(input json.RawMessage) (*core.ToolResult, error) {
	var p struct {
		Recipient string  `json:"recipient"`
		Amount    float64 `json:"amount"`
		Currency  string  `json:"currency"`
	}
	_ = json.Unmarshal(input, &p)
	if p.Currency == "" {
		p.Currency = "USD"
	}
	return toToolResult(map[string]interface{}{
		"transaction_id": fmt.Sprintf("tx_mock_send_%d", time.Now().UnixMilli()),
		"status":         "completed",
		"amount":         p.Amount,
		"currency":       p.Currency,
		"recipient":      p.Recipient,
		"created_at":     time.Now().Format(time.RFC3339),
	})
}

func mockDepositSavings(input json.RawMessage) (*core.ToolResult, error) {
	var p struct {
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
	}
	_ = json.Unmarshal(input, &p)
	if p.Currency == "" {
		p.Currency = "USD"
	}
	return toToolResult(map[string]interface{}{
		"transaction_id":      fmt.Sprintf("tx_mock_dep_%d", time.Now().UnixMilli()),
		"status":              "completed",
		"amount":              p.Amount,
		"currency":            p.Currency,
		"new_savings_balance": 15420.30 + p.Amount,
		"created_at":          time.Now().Format(time.RFC3339),
	})
}

func mockWithdrawSavings(input json.RawMessage) (*core.ToolResult, error) {
	var p struct {
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
	}
	_ = json.Unmarshal(input, &p)
	if p.Currency == "" {
		p.Currency = "USD"
	}
	return toToolResult(map[string]interface{}{
		"transaction_id":      fmt.Sprintf("tx_mock_wd_%d", time.Now().UnixMilli()),
		"status":              "completed",
		"amount":              p.Amount,
		"currency":            p.Currency,
		"new_savings_balance": 15420.30 - p.Amount,
		"created_at":          time.Now().Format(time.RFC3339),
	})
}

func toToolResult(v interface{}) (*core.ToolResult, error) {
	data, err := json.Marshal(v)
	if err != nil {
		return &core.ToolResult{Success: false, Error: err.Error()}, nil
	}
	return &core.ToolResult{Success: true, Data: data}, nil
}

// ============================================================================
// CUSTOM TOOL: SPENDING ANALYZER
// ============================================================================

func createSpendingAnalyzerTool(liminalExecutor core.ToolExecutor) core.Tool {
	return tools.New("analyze_spending").
		Description("Analyze the user's spending patterns over a specified time period. Returns insights about spending velocity, categories, and trends.").
		Schema(tools.ObjectSchema(map[string]interface{}{
			"days": tools.IntegerProperty("Number of days to analyze (default: 30)"),
		})).
		Handler(func(ctx context.Context, toolParams *core.ToolParams) (*core.ToolResult, error) {
			var params struct {
				Days int `json:"days"`
			}
			if err := json.Unmarshal(toolParams.Input, &params); err != nil {
				return &core.ToolResult{
					Success: false,
					Error:   fmt.Sprintf("invalid input: %v", err),
				}, nil
			}

			if params.Days == 0 {
				params.Days = 30
			}

			txRequest := map[string]interface{}{
				"limit": 100,
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

			analysis := analyzeTransactions(transactions, params.Days)

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

func analyzeTransactions(transactions []map[string]interface{}, days int) map[string]interface{} {
	if len(transactions) == 0 {
		return map[string]interface{}{
			"summary": "No transactions found in the specified period",
		}
	}

	var totalSpent, totalReceived float64
	var spendCount, receiveCount int

	for _, tx := range transactions {
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

// ============================================================================
// CUSTOM TOOL: SUBSCRIPTION ANALYZER
// ============================================================================

func createSubscriptionAnalyzerTool(liminalExecutor core.ToolExecutor) core.Tool {
	return tools.New("analyze_subscriptions").
		Description("Scan Transaction History to identify recurring subscriptions and recurring payments. Returns subscription patters, total month costs, and cancellation insights.").
		Schema(tools.ObjectSchema(map[string]interface{}{
			"timeframe_months": tools.IntegerProperty("Number of months to analyze for recurring patterns (default:6)"),
			"min_amount":       tools.NumberProperty("Minimum amount to be considered as subscription (default: 1.00)"),
			"max_amount":       tools.NumberProperty("Maximum amount to be considered as a subscription (default: 999.99)"),
		})).
		Handler(func(ctx context.Context, toolParams *core.ToolParams) (*core.ToolResult, error) {
			var params struct {
				TimeframeMonths int     `json:"timeframe_months"`
				MinAmount       float64 `json:"min_amount"`
				MaxAmount       float64 `json:"max_amount"`
			}
			if err := json.Unmarshal(toolParams.Input, &params); err != nil {
				return &core.ToolResult{
					Success: false,
					Error:   fmt.Sprintf("invalid input: %v", err),
				}, nil
			}
			if params.TimeframeMonths == 0 {
				params.TimeframeMonths = 6
			}
			if params.MinAmount == 0 {
				params.MinAmount = 1.00
			}
			if params.MaxAmount == 0 {
				params.MaxAmount = 999.99
			}

			now := time.Now()
			cutoffDate := now.AddDate(0, -params.TimeframeMonths, 0)

			txRequest := map[string]interface{}{
				"limit":      500,
				"start_date": cutoffDate.Format("2006-01-02"),
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
					Error:   fmt.Sprintf("transaction fetch failed :%s", txResponse.Error),
				}, nil
			}
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
			subscriptions := analyzeForSubscriptions(transactions, cutoffDate, params.MinAmount, params.MaxAmount)
			result := map[string]interface{}{
				"analysis_period":            fmt.Sprintf("%d months", params.TimeframeMonths),
				"total_transactions_scanned": len(transactions),
				"subscriptions_found":        len(subscriptions),
				"subscriptions":              subscriptions,
				"total_monthly_cost":         calculateTotalMonthlyCost(subscriptions),
				"warnings":                   generateWarnings(subscriptions),
				"generated_at":               now.Format(time.RFC3339),
			}
			return &core.ToolResult{
				Success: true,
				Data:    result,
			}, nil
		}).
		Build()
}

func analyzeForSubscriptions(transactions []map[string]interface{}, cutoffDate time.Time, minAmount, maxAmount float64) []map[string]interface{} {
	if len(transactions) == 0 {
		return []map[string]interface{}{}
	}
	type paymentKey struct {
		merchant string
		amount   string
	}
	paymentGroups := make(map[paymentKey][]time.Time)
	for _, tx := range transactions {
		txType, _ := tx["type"].(string)
		if txType != "send" {
			continue
		}
		amount, _ := tx["amount"].(float64)
		if amount < minAmount || amount > maxAmount {
			continue
		}
		merchant := "Unknown"
		if desc, ok := tx["description"].(string); ok && desc != "" {
			merchant = desc
		} else if recipient, ok := tx["recipient"].(string); ok && recipient != "" {
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
		key := paymentKey{merchant: merchant, amount: roundedAmount}
		paymentGroups[key] = append(paymentGroups[key], txDate)
	}
	var subscriptions []map[string]interface{}
	for key, dates := range paymentGroups {
		if len(dates) < 2 {
			continue
		}
		sort.Slice(dates, func(i, j int) bool {
			return dates[i].Before(dates[j])
		})
		intervals := make([]int, 0)
		for i := 1; i < len(dates); i++ {
			daysBetween := int(dates[i].Sub(dates[i-1]).Hours() / 24)
			intervals = append(intervals, daysBetween)
		}
		if isRegularPattern(intervals) {
			amount, _ := strconv.ParseFloat(key.amount, 64)
			frequency := detectFrequency(intervals)
			subscription := map[string]interface{}{
				"merchant":       key.merchant,
				"amount":         amount,
				"frequency":      frequency,
				"occurences":     len(dates),
				"last_occurence": dates[len(dates)-1].Format("2006-01-02"),
				"estimated_next": estimateNextPayment(dates[len(dates)-1], frequency),
				"total_paid":     amount * float64(len(dates)),
				"confidence":     calculateConfidence(len(dates), intervals),
			}
			subscriptions = append(subscriptions, subscription)
		}
	}
	return subscriptions
}

func isRegularPattern(intervals []int) bool {
	if len(intervals) == 0 {
		return false
	}
	sum := 0
	for _, interval := range intervals {
		sum += interval
	}
	avg := float64(sum) / float64(len(intervals))
	withinTolerance := 0
	tolerance := avg * 0.2
	for _, interval := range intervals {
		if math.Abs(float64(interval)-avg) <= tolerance {
			withinTolerance++
		}
	}
	return float64(withinTolerance)/float64(len(intervals)) >= 0.7
}

func detectFrequency(intervals []int) string {
	if len(intervals) == 0 {
		return "unknown"
	}
	sum := 0
	for _, interval := range intervals {
		sum += interval
	}
	avgDays := float64(sum) / float64(len(intervals))
	switch {
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
		return "irregular"
	}
}

func estimateNextPayment(lastPayment time.Time, frequency string) string {
	switch frequency {
	case "monthly":
		return lastPayment.AddDate(0, 1, 0).Format("2006-01-02")
	case "quarterly":
		return lastPayment.AddDate(0, 3, 0).Format("2006-01-02")
	case "semi-annual":
		return lastPayment.AddDate(0, 6, 0).Format("2006-01-02")
	case "annual":
		return lastPayment.AddDate(1, 0, 0).Format("2006-01-02")
	case "biweekly":
		return lastPayment.AddDate(0, 0, 14).Format("2006-01-02")
	case "week":
		return lastPayment.AddDate(0, 0, 7).Format("2006-01-02")
	default:
		return "unknown"
	}
}

func calculateConfidence(occurrences int, intervals []int) string {
	if occurrences >= 4 && isRegularPattern(intervals) {
		return "high"
	} else if occurrences >= 3 {
		return "medium"
	} else {
		return "low"
	}
}

func calculateTotalMonthlyCost(subscriptions []map[string]interface{}) float64 {
	var totalMonthly float64
	for _, sub := range subscriptions {
		amount, _ := sub["amount"].(float64)
		frequency, _ := sub["frequency"].(string)
		switch frequency {
		case "monthly":
			totalMonthly += amount
		case "quarterly":
			totalMonthly += amount / 3
		case "semi-annual":
			totalMonthly += amount / 6
		case "annual":
			totalMonthly += amount / 12
		case "biweekly":
			totalMonthly += amount * 2.167
		case "week":
			totalMonthly += amount * 4.333
		}
	}
	return math.Round(totalMonthly*100) / 100
}

func generateWarnings(subscriptions []map[string]interface{}) []string {
	warnings := make([]string, 0)
	if len(subscriptions) == 0 {
		warnings = append(warnings, "No subscriptions were detected at all in your transaction history.")
		return warnings
	}
	totalMonthly := calculateTotalMonthlyCost(subscriptions)
	warnings = append(warnings, fmt.Sprintf("You are spending approximately $%.2f per month on subscriptions.", totalMonthly))
	merchantCategories := make(map[string][]string)
	knownPatterns := map[string][]string{
		"streaming": {"netflix", "hulu", "disney", "prime", "spotify", "hbo", "apple tv", "youtube premium"},
		"music":     {"spotify", "apply music", "youtube music", "tidal", "pandora"},
		"cloud":     {"dropbox", "google one", "icloud", "onedrive"},
		"fitness":   {"peloton", "classpass", "apple fitness", "strava"},
	}
	for _, sub := range subscriptions {
		merchant, _ := sub["merchant"].(string)
		merchantLower := strings.ToLower(merchant)
		for category, keywords := range knownPatterns {
			for _, keyword := range keywords {
				if strings.Contains(merchantLower, keyword) {
					merchantCategories[category] = append(merchantCategories[category], merchant)
					break
				}
			}
		}
	}
	for category, merchants := range merchantCategories {
		if len(merchants) > 1 {
			warnings = append(warnings, fmt.Sprintf("you have multiple %s subscriptions. %s Consider consolidating.", category, strings.Join(merchants, ",")))
		}
	}
	now := time.Now()
	for _, sub := range subscriptions {
		occurences, _ := sub["occurences"].(int)
		lastDatestr, _ := sub["last_occurence"].(string)
		lastDate, err := time.Parse("2006-01-02", lastDatestr)
		if err == nil && occurences < 3 && now.Sub(lastDate).Hours()/24 > 90 {
			merchant, _ := sub["merchant"].(string)
			warnings = append(warnings, fmt.Sprintf("Subscription to '%s' seems inactive (last paid %s). Consider cancelling if you no longer use.", merchant, lastDatestr))
		}
	}
	if totalMonthly > 50 {
		savings := math.Round(totalMonthly*0.1*100) / 100
		warnings = append(warnings, fmt.Sprintf("Tip: Cancelling just 10%% of your subscriptions can possibly save you $%.2f monthly!", savings))
	}
	return warnings
}

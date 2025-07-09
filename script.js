class CalculatorApp {
  constructor() {
    this.currentCalculator = "basic"
    this.isDark = localStorage.getItem("calculator-theme") === "dark"
    this.display = "0"
    this.expression = ""
    this.history = JSON.parse(localStorage.getItem("calculator-history") || "[]")
    this.justCalculated = false
    this.showHistory = false

    this.init()
  }

  init() {
    this.setupTheme()
    this.setupEventListeners()
    this.updateHistoryDisplay()
    this.updateCalculatorTitle()
  }

  setupTheme() {
    if (this.isDark) {
      document.body.setAttribute("data-theme", "dark")
      document.getElementById("themeIcon").className = "fas fa-sun"
      document.getElementById("themeText").textContent = "Light Mode"
    }
  }

  setupEventListeners() {
    // Sidebar controls
    document.getElementById("menuBtn").addEventListener("click", () => this.openSidebar())
    document.getElementById("closeSidebar").addEventListener("click", () => this.closeSidebar())
    document.getElementById("overlay").addEventListener("click", () => this.closeSidebar())

    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => this.toggleTheme())

    // Menu items
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const calculator = e.currentTarget.getAttribute("data-calculator")
        this.switchCalculator(calculator)
      })
    })

    // Basic calculator
    this.setupBasicCalculator()

    // Other calculators
    this.setupWeightCalculator()
    this.setupLoanCalculator()
    this.setupPercentageCalculator()
    this.setupUnitConverter()
    this.setupTemperatureConverter()
    this.setupTimeCalculator()

    // Prevent zoom on double tap
    let lastTouchEnd = 0
    document.addEventListener(
      "touchend",
      (event) => {
        const now = new Date().getTime()
        if (now - lastTouchEnd <= 300) {
          event.preventDefault()
        }
        lastTouchEnd = now
      },
      false,
    )
  }

  openSidebar() {
    document.getElementById("sidebar").classList.add("open")
    document.getElementById("overlay").classList.add("active")
    document.body.style.overflow = "hidden"
  }

  closeSidebar() {
    document.getElementById("sidebar").classList.remove("open")
    document.getElementById("overlay").classList.remove("active")
    document.body.style.overflow = ""
  }

  toggleTheme() {
    this.isDark = !this.isDark
    localStorage.setItem("calculator-theme", this.isDark ? "dark" : "light")

    if (this.isDark) {
      document.body.setAttribute("data-theme", "dark")
      document.getElementById("themeIcon").className = "fas fa-sun"
      document.getElementById("themeText").textContent = "Light Mode"
    } else {
      document.body.removeAttribute("data-theme")
      document.getElementById("themeIcon").className = "fas fa-moon"
      document.getElementById("themeText").textContent = "Dark Mode"
    }
  }

  switchCalculator(calculatorType) {
    // Update active menu item
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.classList.remove("active")
    })
    document.querySelector(`[data-calculator="${calculatorType}"]`).classList.add("active")

    // Hide all calculators
    document.querySelectorAll(".calculator").forEach((calc) => {
      calc.classList.remove("active")
    })

    // Show selected calculator
    document.getElementById(calculatorType).classList.add("active")

    this.currentCalculator = calculatorType
    this.updateCalculatorTitle()
    this.closeSidebar()
  }

  updateCalculatorTitle() {
    const titles = {
      basic: "Basic Calculator",
      weight: "Weight Calculator",
      loan: "Loan Calculator",
      percentage: "Percentage Calculator",
      unit: "Unit Converter",
      temperature: "Temperature Converter",
      time: "Time Calculator",
    }
    document.getElementById("calculatorTitle").textContent = titles[this.currentCalculator]
  }

  // Basic Calculator Methods
  setupBasicCalculator() {
    // History toggle
    document.getElementById("historyBtn").addEventListener("click", () => {
      this.showHistory = !this.showHistory
      const panel = document.getElementById("historyPanel")
      if (this.showHistory) {
        panel.classList.add("active")
      } else {
        panel.classList.remove("active")
      }
    })

    // Number buttons
    document.querySelectorAll("[data-number]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.handleNumber(e.target.getAttribute("data-number"))
      })
    })

    // Action buttons
    document.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.handleAction(e.target.getAttribute("data-action"))
      })
    })

    // Display click to copy
    document.getElementById("mainDisplay").addEventListener("click", () => {
      this.copyToClipboard(this.display)
    })
  }

  handleNumber(num) {
    if (this.justCalculated) {
      this.display = num
      this.expression = num
      this.justCalculated = false
    } else {
      this.display = this.display === "0" ? num : this.display + num
      this.expression += num
    }
    this.updateDisplay()
  }

  handleAction(action) {
    switch (action) {
      case "clear":
        this.display = "0"
        this.expression = ""
        this.justCalculated = false
        break
      case "plusminus":
        if (this.display !== "0") {
          this.display = this.display.startsWith("-") ? this.display.slice(1) : "-" + this.display
        }
        break
      case "percent":
        const num = Number.parseFloat(this.display)
        const result = num / 100
        this.display = this.formatNumber(result)
        this.expression += "%"
        break
      case "decimal":
        if (!this.display.includes(".")) {
          this.display += "."
          this.expression += "."
        }
        break
      case "add":
      case "subtract":
      case "multiply":
      case "divide":
        this.handleOperator(action)
        break
      case "equals":
        this.handleEquals()
        break
    }
    this.updateDisplay()
  }

  handleOperator(op) {
    const operators = {
      add: "+",
      subtract: "−",
      multiply: "×",
      divide: "÷",
    }

    if (this.justCalculated) {
      this.expression = this.display + " " + operators[op] + " "
      this.justCalculated = false
    } else {
      this.expression += " " + operators[op] + " "
    }
    this.display = "0"
  }

  handleEquals() {
    try {
      const sanitizedExpression = this.expression.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")

      const result = eval(sanitizedExpression)
      const formattedResult = this.formatNumber(result)

      // Add to history
      this.history.unshift({
        expression: this.expression,
        result: formattedResult,
      })

      // Keep only last 10 calculations
      this.history = this.history.slice(0, 10)
      localStorage.setItem("calculator-history", JSON.stringify(this.history))
      this.updateHistoryDisplay()

      this.display = formattedResult
      this.justCalculated = true
    } catch (error) {
      this.display = "Error"
      this.justCalculated = true
    }
  }

  formatNumber(num) {
    if (num.toString().length > 10) {
      return num.toExponential(5)
    }
    return num.toLocaleString()
  }

  updateDisplay() {
    document.getElementById("mainDisplay").textContent = this.display
    document.getElementById("expressionDisplay").textContent = this.expression || " "
  }

  updateHistoryDisplay() {
    const historyList = document.getElementById("historyList")
    if (this.history.length === 0) {
      historyList.innerHTML = '<p class="no-history">No calculations yet</p>'
    } else {
      historyList.innerHTML = this.history
        .map(
          (item) => `
                <div class="history-item">
                    <div class="history-expression">${item.expression}</div>
                    <div class="history-result">= ${item.result}</div>
                </div>
            `,
        )
        .join("")
    }
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
  }

  // Weight Calculator
  setupWeightCalculator() {
    document.getElementById("convertWeight").addEventListener("click", () => {
      this.convertWeight()
    })
  }

  convertWeight() {
    const weight = Number.parseFloat(document.getElementById("weightInput").value)
    const fromUnit = document.getElementById("weightFromUnit").value
    const toUnit = document.getElementById("weightToUnit").value

    if (!weight) return

    const weightUnits = {
      kg: 1,
      lbs: 0.453592,
      g: 0.001,
      oz: 0.0283495,
      stone: 6.35029,
      ton: 1000,
    }

    const weightInKg = weight * weightUnits[fromUnit]
    const convertedWeight = weightInKg / weightUnits[toUnit]

    this.showResult("weightResult", convertedWeight.toFixed(4), this.getWeightUnitLabel(toUnit))
  }

  getWeightUnitLabel(unit) {
    const labels = {
      kg: "Kilograms (kg)",
      lbs: "Pounds (lbs)",
      g: "Grams (g)",
      oz: "Ounces (oz)",
      stone: "Stone",
      ton: "Tons",
    }
    return labels[unit]
  }

  // Loan Calculator
  setupLoanCalculator() {
    document.getElementById("calculateLoan").addEventListener("click", () => {
      this.calculateLoan()
    })
  }

  calculateLoan() {
    const principal = Number.parseFloat(document.getElementById("loanAmount").value)
    const rate = Number.parseFloat(document.getElementById("interestRate").value)
    const time = Number.parseFloat(document.getElementById("loanTerm").value)

    if (!principal || !rate || !time) return

    const monthlyRate = rate / 100 / 12
    const numPayments = time * 12

    let monthlyPayment, totalPayment, totalInterest

    if (rate === 0) {
      monthlyPayment = principal / numPayments
      totalPayment = principal
      totalInterest = 0
    } else {
      monthlyPayment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      totalPayment = monthlyPayment * numPayments
      totalInterest = totalPayment - principal
    }

    this.showLoanResult(monthlyPayment, totalPayment, totalInterest)
  }

  showLoanResult(monthly, total, interest) {
    const resultPanel = document.getElementById("loanResult")
    resultPanel.innerHTML = `
            <div class="result-title">Monthly Payment</div>
            <div class="result-value">$${monthly.toFixed(2)}</div>
            <div class="loan-results">
                <div class="loan-result-item">
                    <div class="loan-result-label">Total Payment</div>
                    <div class="loan-result-value">$${total.toFixed(2)}</div>
                </div>
                <div class="loan-result-item">
                    <div class="loan-result-label">Total Interest</div>
                    <div class="loan-result-value">$${interest.toFixed(2)}</div>
                </div>
            </div>
        `
    resultPanel.classList.add("active")
  }

  // Percentage Calculator
  setupPercentageCalculator() {
    document.getElementById("calculatePercentage").addEventListener("click", () => {
      this.calculatePercentage()
    })

    document.getElementById("percentageOperation").addEventListener("change", () => {
      this.updatePercentageLabels()
    })

    this.updatePercentageLabels()
  }

  updatePercentageLabels() {
    const operation = document.getElementById("percentageOperation").value
    const label1 = document.getElementById("percentageLabel1")
    const label2 = document.getElementById("percentageLabel2")

    const labels = {
      percentage: { p1: "Percentage", p2: "Number" },
      percent_of: { p1: "Number", p2: "Total" },
      percent_change: { p1: "Original", p2: "New" },
      add_percent: { p1: "Percentage", p2: "Number" },
      subtract_percent: { p1: "Percentage", p2: "Number" },
    }

    label1.textContent = labels[operation].p1
    label2.textContent = labels[operation].p2
  }

  calculatePercentage() {
    const value1 = Number.parseFloat(document.getElementById("percentageValue1").value)
    const value2 = Number.parseFloat(document.getElementById("percentageValue2").value)
    const operation = document.getElementById("percentageOperation").value

    if (!value1 || !value2) return

    let result = 0
    let isPercentage = false

    switch (operation) {
      case "percentage":
        result = (value1 / 100) * value2
        break
      case "percent_of":
        result = (value1 / value2) * 100
        isPercentage = true
        break
      case "percent_change":
        result = ((value2 - value1) / value1) * 100
        isPercentage = true
        break
      case "add_percent":
        result = value2 + (value1 / 100) * value2
        break
      case "subtract_percent":
        result = value2 - (value1 / 100) * value2
        break
    }

    this.showResult("percentageResult", result.toFixed(2) + (isPercentage ? "%" : ""), "")
  }

  // Unit Converter
  setupUnitConverter() {
    document.getElementById("convertUnit").addEventListener("click", () => {
      this.convertUnit()
    })
  }

  convertUnit() {
    const value = Number.parseFloat(document.getElementById("unitValue").value)
    const fromUnit = document.getElementById("unitFromUnit").value
    const toUnit = document.getElementById("unitToUnit").value

    if (!value) return

    const lengthUnits = {
      m: 1,
      ft: 0.3048,
      in: 0.0254,
      cm: 0.01,
      mm: 0.001,
      km: 1000,
      yd: 0.9144,
      mi: 1609.34,
    }

    const meters = value * lengthUnits[fromUnit]
    const convertedValue = meters / lengthUnits[toUnit]

    this.showResult("unitResult", convertedValue.toFixed(6), this.getUnitLabel(toUnit))
  }

  getUnitLabel(unit) {
    const labels = {
      m: "Meters (m)",
      ft: "Feet (ft)",
      in: "Inches (in)",
      cm: "Centimeters (cm)",
      mm: "Millimeters (mm)",
      km: "Kilometers (km)",
      yd: "Yards (yd)",
      mi: "Miles (mi)",
    }
    return labels[unit]
  }

  // Temperature Converter
  setupTemperatureConverter() {
    document.getElementById("convertTemperature").addEventListener("click", () => {
      this.convertTemperature()
    })
  }

  convertTemperature() {
    const temp = Number.parseFloat(document.getElementById("temperatureValue").value)
    const fromUnit = document.getElementById("temperatureFromUnit").value
    const toUnit = document.getElementById("temperatureToUnit").value

    if (temp === undefined || temp === null || isNaN(temp)) return

    let celsius = temp

    // Convert to Celsius first
    switch (fromUnit) {
      case "fahrenheit":
        celsius = ((temp - 32) * 5) / 9
        break
      case "kelvin":
        celsius = temp - 273.15
        break
      case "rankine":
        celsius = ((temp - 491.67) * 5) / 9
        break
    }

    // Convert from Celsius to target unit
    let convertedTemp = celsius
    switch (toUnit) {
      case "fahrenheit":
        convertedTemp = (celsius * 9) / 5 + 32
        break
      case "kelvin":
        convertedTemp = celsius + 273.15
        break
      case "rankine":
        convertedTemp = ((celsius + 273.15) * 9) / 5
        break
    }

    this.showResult("temperatureResult", convertedTemp.toFixed(2) + "°", this.getTemperatureUnitLabel(toUnit))
  }

  getTemperatureUnitLabel(unit) {
    const labels = {
      celsius: "Celsius (°C)",
      fahrenheit: "Fahrenheit (°F)",
      kelvin: "Kelvin (K)",
      rankine: "Rankine (°R)",
    }
    return labels[unit]
  }

  // Time Calculator
  setupTimeCalculator() {
    document.getElementById("calculateTime").addEventListener("click", () => {
      this.calculateTime()
    })
  }

  calculateTime() {
    const hours1 = Number.parseInt(document.getElementById("time1Hours").value) || 0
    const minutes1 = Number.parseInt(document.getElementById("time1Minutes").value) || 0
    const seconds1 = Number.parseInt(document.getElementById("time1Seconds").value) || 0

    const hours2 = Number.parseInt(document.getElementById("time2Hours").value) || 0
    const minutes2 = Number.parseInt(document.getElementById("time2Minutes").value) || 0
    const seconds2 = Number.parseInt(document.getElementById("time2Seconds").value) || 0

    const operation = document.getElementById("timeOperation").value

    const time1Seconds = hours1 * 3600 + minutes1 * 60 + seconds1
    const time2Seconds = hours2 * 3600 + minutes2 * 60 + seconds2

    let resultSeconds = 0
    if (operation === "add") {
      resultSeconds = time1Seconds + time2Seconds
    } else {
      resultSeconds = Math.abs(time1Seconds - time2Seconds)
    }

    const hours = Math.floor(resultSeconds / 3600)
    const minutes = Math.floor((resultSeconds % 3600) / 60)
    const seconds = resultSeconds % 60

    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

    this.showResult("timeResult", formattedTime, "HH:MM:SS")
  }

  // Utility method to show results
  showResult(elementId, value, unit) {
    const resultPanel = document.getElementById(elementId)
    resultPanel.innerHTML = `
            <div class="result-title">Result</div>
            <div class="result-value">${value}</div>
            ${unit ? `<div class="result-unit">${unit}</div>` : ""}
        `
    resultPanel.classList.add("active")
    resultPanel.classList.add("fade-in")
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CalculatorApp()
})

// Prevent context menu on long press
document.addEventListener("contextmenu", (e) => {
  e.preventDefault()
})

// Prevent text selection
document.addEventListener("selectstart", (e) => {
  if (e.target.tagName !== "INPUT") {
    e.preventDefault()
  }
})

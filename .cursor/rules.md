# Anti-Legacy Code Rules
# Universal Principles for Preventing Technical Debt

## Core Philosophy

**Legacy code is code that nobody understands - not humans, not AI assistants, not future maintainers.**

Programming is fundamentally about theory building, not producing lines of code. Every piece of code should express clear intent, embody understandable mental models, and tell a story that any competent developer can follow.

## Table of Contents
1. [Universal Principles](#universal-principles)
2. [Theory Building Guidelines](#theory-building-guidelines)
3. [Naming and Intent](#naming-and-intent)
4. [Structure and Organization](#structure-and-organization)
5. [Complexity Management](#complexity-management)
6. [Future-Proofing](#future-proofing)
7. [Quality and Review](#quality-and-review)
8. [AI Assistant Guidelines](#ai-assistant-guidelines)
9. [Enforcement Rules](#enforcement-rules)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Universal Principles

### 1. Clarity Over Cleverness
```
✅ Choose explicit over implicit behavior
✅ Favor readability over brevity when they conflict
✅ Write code that reduces cognitive load
✅ Design for the next person who will read this code
```

### 2. Intent-Driven Development
```
✅ Every function, class, and module should have a single, clear purpose
✅ Code should express the "what" and "why", not just the "how"
✅ Business logic should be separated from implementation details
✅ Domain concepts should be encoded in the type system when possible
```

### 3. Sustainable Growth
```
✅ Write code that gets easier to modify over time
✅ Design for extensibility without over-engineering
✅ Create abstractions only when patterns emerge
✅ Refactor continuously to prevent entropy
```

---

## Theory Building Guidelines

### Mental Model Clarity
```javascript
// ✅ GOOD: Expresses clear mental model
class OrderProcessor {
  processPayment(order, paymentMethod) {
    this.validateOrder(order);
    this.chargePayment(paymentMethod, order.total);
    this.fulfillOrder(order);
    this.notifyCustomer(order);
  }
}

// ❌ BAD: Unclear mental model
class OrderProcessor {
  process(o, pm) {
    if (o.valid && pm.type == 'cc') {
      charge(pm, o.amt);
      ship(o);
    }
  }
}
```

### Concept Mapping
```python
# ✅ GOOD: Domain concepts clearly mapped
def calculate_compound_interest(principal, annual_rate, compounding_frequency, years):
    """Calculate compound interest using the standard financial formula."""
    return principal * (1 + annual_rate / compounding_frequency) ** (compounding_frequency * years)

# ❌ BAD: Formula without context
def calc(p, r, n, t):
    return p * (1 + r/n) ** (n*t)
```

### Progressive Disclosure
```java
// ✅ GOOD: Complex logic broken into understandable steps
public class DataValidator {
    public ValidationResult validate(UserData data) {
        ValidationResult result = new ValidationResult();
        
        validateRequiredFields(data, result);
        validateEmailFormat(data, result);
        validateBusinessRules(data, result);
        
        return result;
    }
    
    private void validateRequiredFields(UserData data, ValidationResult result) {
        // Clear, focused validation logic
    }
}

// ❌ BAD: Everything in one massive method
public ValidationResult validate(UserData data) {
    // 200 lines of mixed validation logic
}
```

---

## Naming and Intent

### Self-Documenting Code Rules
```
✅ Use domain language in variable and function names
✅ Boolean variables should read like questions (isValid, hasPermission, canEdit)
✅ Function names should be verbs describing what they do
✅ Class names should be nouns describing what they represent
✅ Avoid abbreviations unless they're universally understood
✅ Use consistent terminology throughout the codebase
```

### Naming Patterns by Language
```typescript
// TypeScript/JavaScript
interface PaymentProcessor {
  processPayment(amount: Money, method: PaymentMethod): Promise<PaymentResult>;
  validatePaymentMethod(method: PaymentMethod): ValidationResult;
}

// Python
class PaymentProcessor:
    def process_payment(self, amount: Money, method: PaymentMethod) -> PaymentResult:
        pass
    
    def validate_payment_method(self, method: PaymentMethod) -> ValidationResult:
        pass

// Java
public interface PaymentProcessor {
    PaymentResult processPayment(Money amount, PaymentMethod method);
    ValidationResult validatePaymentMethod(PaymentMethod method);
}
```

### Comment Guidelines
```
✅ Comments should explain WHY, not WHAT
✅ Document business rules and domain constraints
✅ Explain non-obvious algorithmic choices
✅ Reference external documentation or standards
✅ Update comments when code changes

❌ Avoid redundant comments that restate the code
❌ Don't use comments to explain poorly named variables
❌ Don't comment out code - delete it
```

---

## Structure and Organization

### Modular Design Principles
```
✅ Single Responsibility: Each module has one reason to change
✅ Interface Segregation: Clients depend only on what they use
✅ Dependency Inversion: Depend on abstractions, not concretions
✅ Separation of Concerns: UI, business logic, and data access are separate
```

### Dependency Management
```
✅ Make dependencies explicit through constructor injection
✅ Avoid circular dependencies
✅ Keep dependency graphs shallow and directed
✅ Use interfaces to decouple modules
✅ Group related functionality in cohesive modules
```

---

## Complexity Management

### Breaking Down Complex Problems
```python
# ✅ GOOD: Complex algorithm broken into steps
def optimize_delivery_routes(orders, vehicles, constraints):
    """Optimize delivery routes using genetic algorithm approach."""
    initial_population = generate_initial_solutions(orders, vehicles)
    
    for generation in range(MAX_GENERATIONS):
        fitness_scores = evaluate_population(initial_population, constraints)
        parents = select_parents(initial_population, fitness_scores)
        offspring = generate_offspring(parents)
        initial_population = survivors(parents + offspring, constraints)
        
        if convergence_criteria_met(fitness_scores):
            break
    
    return best_solution(initial_population)

# ❌ BAD: Everything in one function
def optimize_routes(orders, vehicles, constraints):
    # 500 lines of mixed genetic algorithm logic
```

### Cognitive Load Reduction
```
✅ Limit function parameters (max 3-4 for most cases)
✅ Keep functions under 20-30 lines when possible
✅ Use early returns to reduce nesting
✅ Extract complex conditionals into well-named functions
✅ Avoid deep inheritance hierarchies (prefer composition)
```

### Conditional Logic Patterns
```csharp
// ✅ GOOD: Clear conditional logic
public class OrderValidator 
{
    public ValidationResult Validate(Order order)
    {
        if (OrderIsEmpty(order))
            return ValidationResult.Error("Order cannot be empty");
            
        if (CustomerIsBlacklisted(order.Customer))
            return ValidationResult.Error("Customer is blacklisted");
            
        if (InsufficientInventory(order))
            return ValidationResult.Error("Insufficient inventory");
            
        return ValidationResult.Success();
    }
    
    private bool OrderIsEmpty(Order order) => !order.Items.Any();
    private bool CustomerIsBlacklisted(Customer customer) => _blacklist.Contains(customer.Id);
    private bool InsufficientInventory(Order order) => order.Items.Any(item => item.Quantity > _inventory.GetStock(item.ProductId));
}

// ❌ BAD: Nested conditional nightmare
public ValidationResult Validate(Order order)
{
    if (order != null)
    {
        if (order.Items != null && order.Items.Count > 0)
        {
            if (!_blacklist.Contains(order.Customer.Id))
            {
                // More nesting...
            }
        }
    }
}
```

---

## Future-Proofing

### Maintainable Code Characteristics
```
✅ Code that's easy to test in isolation
✅ Functionality that can be extended without modification
✅ Clear error handling and recovery strategies
✅ Graceful degradation when dependencies fail
✅ Explicit configuration and environment handling
```

### Extensibility Patterns
```rust
// ✅ GOOD: Open for extension, closed for modification
trait PaymentProcessor {
    fn process_payment(&self, payment: &Payment) -> Result<PaymentResult, PaymentError>;
}

struct CreditCardProcessor {
    gateway: CreditCardGateway,
}

struct PayPalProcessor {
    api_client: PayPalClient,
}

impl PaymentProcessor for CreditCardProcessor {
    fn process_payment(&self, payment: &Payment) -> Result<PaymentResult, PaymentError> {
        // Credit card specific implementation
    }
}

impl PaymentProcessor for PayPalProcessor {
    fn process_payment(&self, payment: &Payment) -> Result<PaymentResult, PaymentError> {
        // PayPal specific implementation
    }
}

// Adding new payment methods doesn't require changing existing code
```

### Error Handling Standards
```go
// ✅ GOOD: Explicit error handling
func ProcessOrder(order Order) (*OrderResult, error) {
    if err := validateOrder(order); err != nil {
        return nil, fmt.Errorf("order validation failed: %w", err)
    }
    
    payment, err := processPayment(order.Payment)
    if err != nil {
        return nil, fmt.Errorf("payment processing failed: %w", err)
    }
    
    if err := fulfillOrder(order); err != nil {
        // Compensating action
        refundPayment(payment)
        return nil, fmt.Errorf("order fulfillment failed: %w", err)
    }
    
    return &OrderResult{OrderID: order.ID, PaymentID: payment.ID}, nil
}

// ❌ BAD: Silent failures and unclear error states
func ProcessOrder(order Order) *OrderResult {
    if validateOrder(order) {
        payment := processPayment(order.Payment)
        if payment != nil {
            fulfillOrder(order)
            return &OrderResult{OrderID: order.ID}
        }
    }
    return nil // What went wrong?
}
```

---

## Quality and Review

### Self-Review Checklist
```
□ Can someone unfamiliar with this code understand its purpose in 30 seconds?
□ Are all business rules expressed clearly in the code or documentation?
□ Would this code be easy to modify if requirements change?
□ Are error conditions handled explicitly and appropriately?
□ Is the code testable without extensive mocking or setup?
□ Do variable and function names express their intent clearly?
□ Is complex logic broken down into understandable steps?
□ Are dependencies explicit and minimal?
```

### Testing Considerations
```
✅ Write tests that document intended behavior
✅ Test edge cases and error conditions
✅ Use descriptive test names that explain the scenario
✅ Keep tests simple and focused on one aspect
✅ Make tests independent and repeatable
```

### Documentation Standards
```
✅ README files explain project purpose and setup
✅ API documentation is up-to-date and includes examples
✅ Architecture decisions are recorded (ADRs)
✅ Complex algorithms are documented with references
✅ Public interfaces have clear contracts
```

---

## AI Assistant Guidelines

### Code Generation Standards
```
✅ Always provide complete, runnable code examples
✅ Include necessary imports and dependencies
✅ Explain complex decisions with inline comments
✅ Show before/after examples when refactoring
✅ Validate generated code against existing patterns
```

### Refactoring Approach
```
✅ Maintain backward compatibility when possible
✅ Preserve existing API contracts
✅ Explain the reasoning behind architectural changes
✅ Suggest incremental improvements over big rewrites
✅ Consider performance implications of changes
```

### Context Awareness
```
✅ Understand the business domain before suggesting changes
✅ Respect existing architectural decisions
✅ Consider team preferences and established patterns
✅ Flag potential breaking changes
✅ Suggest appropriate testing strategies
```

---

## Enforcement Rules

### Pre-Commit Requirements
```
□ Code builds without warnings
□ All tests pass
□ Code coverage meets project standards
□ Static analysis tools pass
□ Documentation is updated for public API changes
□ Complex logic includes explanatory comments
□ New dependencies are justified and documented
```

### Code Review Focus Areas
```
□ Intent and clarity over cleverness
□ Separation of concerns
□ Error handling completeness
□ Testing strategy appropriateness
□ Performance implications
□ Security considerations
□ Maintainability assessment
```

### Quality Gates
```
□ No function exceeds reasonable complexity metrics
□ Dependencies are explicit and justified
□ Business logic is separated from infrastructure
□ Error paths are tested
□ Performance is within acceptable bounds
□ Security vulnerabilities are addressed
```

---

## Anti-Patterns to Avoid

### Code Smells
```
❌ God objects that do everything
❌ Long parameter lists (>4 parameters)
❌ Deeply nested conditional logic (>3 levels)
❌ Duplicated code across modules
❌ Circular dependencies
❌ Global state modifications
❌ Magic numbers and strings
❌ Overly generic abstractions
❌ Premature optimization
❌ Inadequate error handling
```

### Architectural Anti-Patterns
```
❌ Big Ball of Mud: No clear structure or boundaries
❌ Spaghetti Code: Tangled, hard-to-follow control flow
❌ Golden Hammer: Using same solution for all problems
❌ Vendor Lock-in: Over-dependence on specific technologies
❌ Analysis Paralysis: Over-architecting before understanding requirements
```

### Process Anti-Patterns
```
❌ Skipping code reviews for "simple" changes
❌ Not updating documentation with code changes
❌ Postponing refactoring "until later"
❌ Ignoring technical debt warnings
❌ Writing code without tests
❌ Committing debugging code to main branch
```

---

## Quick Reference

### Daily Development Checklist
```
□ Does this code express clear intent?
□ Would a new team member understand this?
□ Is this the simplest solution that works?
□ Are edge cases handled appropriately?
□ Is this code easy to test?
□ Does this increase or decrease system complexity?
□ Are dependencies minimized and explicit?
□ Is error handling comprehensive?
```

### When to Refactor
```
□ Adding new feature requires understanding old code
□ Bug fixes become increasingly difficult
□ Code reviews take too long due to complexity
□ Tests are hard to write or maintain
□ New team members struggle to contribute
□ Performance issues stem from structural problems
```

### Red Flags
```
🚩 "This code is temporary" (it never is)
🚩 "I'll clean this up later" (schedule it now)
🚩 "Only I know how this works" (document it)
🚩 "It's too complex to test" (simplify it)
🚩 "We don't have time for proper error handling" (make time)
🚩 "The requirements will probably change" (build for change)
```

---

## Remember

**Legacy code is created one shortcut at a time. Every decision to prioritize speed over clarity, every skipped test, every uncommented hack, every "temporary" workaround that becomes permanent - these are the building blocks of technical debt.**

**The goal is not perfect code, but understandable code. Code that tells a story. Code that respects the time and mental energy of every future developer who will work with it.**

**Programming is theory building. Build good theories.** 
# Debug

You are tasked with helping debug CausalOps Copilot issues during manual testing or implementation. This command allows you to investigate problems by examining logs, application state, and git history without editing files.

## Initial Response

When invoked WITH a plan/ticket file:
```
I'll help debug issues with [file name]. Let me understand the current state.

What specific problem are you encountering?
- What were you trying to test/implement?
- What went wrong?
- Any error messages?

I'll investigate the logs, database, and git state to help figure out what's happening.
```

When invoked WITHOUT parameters:
```
I'll help debug your current issue.

Please describe what's going wrong:
- What are you working on?
- What specific problem occurred?
- When did it last work?

I can investigate logs, database state, and recent changes to help identify the issue.
```

## Environment Information

You have access to these key locations and tools:

**Application Logs**:
- Agent service logs: Check console output from `npm run dev` in agent directory
- UI logs: Check browser console and Next.js dev server output
- Application logs: Check any log files in logs/ directory if created

**Application State**:
- Elastic indices: Check data in configured Elastic index
- Vertex AI: Check API call logs and responses
- File system: Check any temporary files or cache

**Git State**:
- Check current branch, recent commits, uncommitted changes
- Similar to how `commit` and `describe_pr` commands work

**Service Status**:
- Check if agent is running: `ps aux | grep node` (look for agent process)
- Check if UI is running: `ps aux | grep next` (look for Next.js process)
- Check ports: `lsof -i :3000` (UI) and `lsof -i :8080` (agent) or configured ports

## Process Steps

### Step 1: Understand the Problem

After the user describes the issue:

1. **Read any provided context** (plan or ticket file):
   - Understand what they're implementing/testing
   - Note which phase or step they're on
   - Identify expected vs actual behavior

2. **Quick state check**:
   - Current git branch and recent commits
   - Any uncommitted changes
   - When the issue started occurring

### Step 2: Investigate the Issue

Spawn parallel Task agents for efficient investigation:

```
Task 1 - Check Recent Logs:
Find and analyze recent application output for errors:
1. Check agent service console output for any errors
2. Check UI/Next.js console output for build or runtime errors
3. Check browser console for frontend JavaScript errors
4. Look for API call failures or Elastic/Vertex AI connection issues
5. Look for stack traces or repeated errors
Return: Key errors/warnings with context
```

```
Task 2 - Database State:
Check the current application state:
1. Test API endpoints: curl http://localhost:8080/health
2. Check Elastic connectivity: test queries to configured index
3. Check Vertex AI: test API authentication and connectivity
4. Verify environment variables and configuration
5. Check for any cached data or temporary files
Return: Application state findings
```

```
Task 3 - Git and File State:
Understand what changed recently:
1. Check git status and current branch
2. Look at recent commits: git log --oneline -10
3. Check uncommitted changes: git diff
4. Verify expected files exist
5. Look for any file permission issues
Return: Git state and any file issues
```

### Step 3: Present Findings

Based on the investigation, present a focused debug report:

```markdown
## Debug Report

### What's Wrong
[Clear statement of the issue based on evidence]

### Evidence Found

**From Logs**:
- [Error/warning with timestamp]
- [Pattern or repeated issue]

**From Application State**:
- API endpoints status
- Elastic/Vertex AI connectivity
- Configuration issues

**From Git/Files**:
- [Recent changes that might be related]
- [File state issues]

### Root Cause
[Most likely explanation based on evidence]

### Next Steps

1. **Try This First**:
   ```bash
   [Specific command or action]
   ```

2. **If That Doesn't Work**:
   - Restart services: `npm run dev` in both agent/ and ui/ directories
   - Check browser console for frontend errors
   - Run with debug: Enable debug logging in application config

### Can't Access?
Some issues might be outside my reach:
- Browser console errors (F12 in browser)
- MCP server internal state
- System-level issues

Would you like me to investigate something specific further?
```

## Important Notes

- **Focus on manual testing scenarios** - This is for debugging during implementation
- **Always require problem description** - Can't debug without knowing what's wrong
- **Read files completely** - No limit/offset when reading context
- **Think like `commit` or `describe_pr`** - Understand git state and changes
- **Guide back to user** - Some issues (browser console, MCP internals) are outside reach
- **No file editing** - Pure investigation only

## Quick Reference

**Check Services**:
```bash
ps aux | grep node    # Node.js processes (agent)
ps aux | grep next    # Next.js processes (ui)
lsof -i :3000        # UI port
lsof -i :8080        # Agent port
```

**Test API**:
```bash
curl http://localhost:8080/health
curl http://localhost:8080/diagnose -X POST -H "Content-Type: application/json" -d '{}'
```

**Environment Check**:
```bash
env | grep ELASTIC
env | grep VERTEX
env | grep GOOGLE
```

**Git State**:
```bash
git status
git log --oneline -10
git diff
```

Remember: This command helps you investigate without burning the primary window's context. Perfect for when you hit an issue during manual testing and need to dig into logs, database, or git state.

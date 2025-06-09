## Running Automated Tests (Vitest)

npm test

### Run All Tests in Terminal (Verbose Output)

# Option 1: running the test and auto run when needed
pnpm run test:watch

* Shows the hierarchy of `describe` and `it` blocks along with pass/fail status.
* Note the extra `--` needed to pass flags through npm to the Vitest command.

### Supbase production data schema dump
npx supabase link --project-ref awtjzxyuhcejzxmzoqwr | gdYSVWQZ$aV2EC$ (production)
npx supabase link --project-ref zzapbmpqkqeqsrqwttzd | NcxiGGn!Q.C@H6T (dev)
npx supabase db dump --schema public --schema auth --schema storage --file "./docs/supabase/full_schema_dump.sql"

### Get folder and file structure of current project
tree /f /a > output.txt

### Copy Folder
xcopy "test-app-1" "test-app-1-copy" /E /I /H /Y

### Linking to Supabase project
npx supabase link --project-ref awtjzxyuhcejzxmzoqwr | gdYSVWQZ$aV2EC$ (production)
npx supabase link --project-ref zzapbmpqkqeqsrqwttzd | NcxiGGn!Q.C@H6T (dev)

### Getting Supabase Secrets
link to your project e.g. npx supabase link --project-ref [project id]
npx supabase secrets list

## initial supabase dump
1. link to supabse DEV | npx supabase link --project-ref zzapbmpqkqeqsrqwttzd | NcxiGGn!Q.C@H6T
2. npx supabase db diff --linked --file init-schema.sql (run in supabase/migrations folder)
3. link to PROD | npx supabase link --project-ref awtjzxyuhcejzxmzoqwr | gdYSVWQZ$aV2EC$
4. do initial push into prod db | npx supabase db push

## Incremental Changes
1. change sb table in remote dev
2. in local supabase folder run npx supabase db diff --linked --file file-description (timestamp and .sql will be added)
-> should create a migration file in supabase/migrations folder
3. link to PROD | npx supabase link --project-ref awtjzxyuhcejzxmzoqwr | gdYSVWQZ$aV2EC$
4. npx supabase db push (anywhere in project folder)
5. Should get a confirm to make changes -> should finish

If you want to delete make changes in both dbs
-> example: migration file to add test table in production from a migration file (npx supabase push -> that created this table)
1. link to PROD | npx supabase link --project-ref awtjzxyuhcejzxmzoqwr | gdYSVWQZ$aV2EC$
2. delete the local migration files (e.g. migration file that just made that test table)
3. supabase migration repair --status reverted 20250526122800 <- timestamp of that migration file 20250526122800_add-test-table

## Cursor code changes in main/dev and push to release/prod
1. Make code changes in dev -> commit -> sync to GitHub to update main branch in GitHub (and updates vercel dev)
2. Change cursor branch to release
3. click 3 dots -> pull to get latest changes from GitHub
4. click 3 dots -> branch -> merge branch -> main -> confirm
5. select Sync or (3 dots -> push)

## Supabase edge functions | whenever edge functions are CRUD | must be in each supabase project (test-app, main-app)
1. link to npx supabase link --project-ref [project-name]
2. npx supabase functions deploy | for all
3. npx supabase functions deploy [edge-function] e.g. invite-member

note: for set-active-org-claim edge function, make sure the Enforce JWT Verification= OFF

## Finding file lengths
Get-ChildItem -Path "lib/image-generator" -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.Name -notmatch "test" } | ForEach-Object { $lc = (Get-Content $_.FullName | Measure-Object -Line).Lines; [PSCustomObject]@{File=$_.Name; Lines=$lc; Path=$_.FullName} } | Sort-Object Lines -Descending | Select-Object -First 15

## Run bundle analyzer and lighthouse
pnpm run analyze     # Bundle analysis only
pnpm run lighthouse  # Lighthouse audit only
pnpm run perf        # Run both

## Run run storyboard
Storybook - pnpm run storybook → http://localhost:6006

## Playright Testing
# Watch the test run in real browser
pnpm test:e2e:headed

# Step through failures
pnpm test:e2e:debug

# Visual test management
pnpm test:e2e:ui

npx playwright test --list
npx playwright test image-generation.spec.ts --list
npx playwright test visual-regression.spec.ts --list
npx playwright test dam-integration.spec.ts --list

# Run only Chromium/Chrome tests
npx playwright test --project=chromium

# Or run specific Chrome test
npx playwright test image-generation.spec.ts --project=chromium --headed

# Or run the critical test in Chrome only
npx playwright test --grep "CRITICAL" --project=chromium

# To run with a full video and trace
npx playwright test image-generation.spec.ts --project=chromium --trace on --videon on
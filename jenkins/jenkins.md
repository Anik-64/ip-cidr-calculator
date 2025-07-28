# CI/CD with Jenkins

The project uses a Jenkins pipeline with the **Generic Webhook Trigger Plugin** to automate builds when a pull request (PR) from the `dev` branch is merged into the `main` branch. This follows industry best practices for ensuring production-ready code is built only after review and merge.

---

## GitHub Webhook Configuration

1. Go to your GitHub repository → **Settings** → **Webhooks** → **Add webhook**.
2. Set the following values:
   - **Payload URL**: `http://<YOUR_JENKINS_IP>:8080/generic-webhook-trigger/invoke?token=<YOUR_TOKEN>`
   - **Content type**: `application/json`
   - **Trigger**: Select `Pull requests`
3. Click **Add Webhook**.

---

## Jenkins Credentials (DockerHub)

1. In Jenkins, go to **Manage Jenkins** → **Credentials**.
2. Choose `global` or a specific folder scope and click **Add Credentials**.
   - **Type**: `Username with password`
   - **ID**: `{YOUR_ID}`
   - **Username**: Your DockerHub username
   - **Password**: Your DockerHub access token or password

---

## Jenkins Pipeline Setup

1. Install the **Generic Webhook Trigger Plugin** in Jenkins via **Manage Jenkins** → **Manage Plugins**.
2. Create a new **Pipeline** job in Jenkins.
3. Under **Build Triggers**, check:
   - ✅ **Generic Webhook Trigger**

### Configure the Generic Webhook Trigger:

- **Post content parameters**:
  - `Variable: action`  
    `Expression: $.action`  
    `Expression Type: JSONPath`
  - `Variable: merged`  
    `Expression: $.pull_request.merged`  
    `Expression Type: JSONPath`
  - `Variable: head_ref`  
    `Expression: $.pull_request.head.ref`  
    `Expression Type: JSONPath`
  - `Variable: base_ref`  
    `Expression: $.pull_request.base.ref`  
    `Expression Type: JSONPath`

- **Optional filter**:
  - **Text**: `$action $merged $head_ref $base_ref`
  - **Expression**: `closed true dev main`

- **Token**: `<YOUR_TOKEN>` (must match the one used in the GitHub webhook)

- ✅ **Print contributed variables** – for debugging  
- ✅ **Print post content** – to log the webhook payload

---

## Pipeline Definition

Under the **Pipeline** section:

- **Definition**: `Pipeline script from SCM`
- **SCM**: `Git`
- **Repository URL**: `https://github.com/Anik-64/ip-cidr-calculator.git`
- **Branches to build**: `main`
- **Script Path**: `Jenkinsfile-dipti`

Click **Save**.

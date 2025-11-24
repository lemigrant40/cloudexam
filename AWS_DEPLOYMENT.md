# AWS App Runner Deployment Guide

Complete guide for deploying CloudExam Prep to AWS App Runner.

## Prerequisites

- AWS CLI installed and configured
- Docker installed
- AWS Account with appropriate permissions
- Your `questions.json` file ready

## Method 1: Deploy from ECR (Recommended)

### Step 1: Configure AWS CLI

```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### Step 2: Create ECR Repository

```bash
# Set variables
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REPO_NAME="cloudexam-prep"

# Create ECR repository
aws ecr create-repository \
    --repository-name $REPO_NAME \
    --region $AWS_REGION

echo "Repository created: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME"
```

### Step 3: Build and Push Docker Image

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image
docker build -t cloudexam-prep .

# Tag image
docker tag cloudexam-prep:latest \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest

echo "✅ Image pushed successfully!"
```

### Step 4: Create App Runner Service

#### Option A: Using AWS Console

1. Go to [AWS App Runner Console](https://console.aws.amazon.com/apprunner)
2. Click **"Create service"**
3. **Source:**
   - Repository type: Container registry
   - Provider: Amazon ECR
   - Container image URI: `YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/cloudexam-prep:latest`
   - Deployment trigger: Automatic
4. **Deployment settings:**
   - ECR access role: Create new service role
5. **Service settings:**
   - Service name: `cloudexam-prep`
   - Port: `3000`
   - CPU: 1 vCPU
   - Memory: 2 GB
6. **Health check:**
   - Protocol: HTTP
   - Path: `/health`
   - Interval: 20 seconds
   - Timeout: 5 seconds
   - Healthy threshold: 1
   - Unhealthy threshold: 5
7. **Security:**
   - Instance role: (optional) create if you need AWS service access
8. Click **"Create & deploy"**

#### Option B: Using AWS CLI

Create a file `apprunner-config.json`:

```json
{
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/cloudexam-prep:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production"
        }
      }
    },
    "AutoDeploymentsEnabled": true,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/AppRunnerECRAccessRole"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 20,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
```

Create the service:

```bash
aws apprunner create-service \
    --service-name cloudexam-prep \
    --region $AWS_REGION \
    --cli-input-json file://apprunner-config.json
```

### Step 5: Get Service URL

```bash
# Get service details
aws apprunner describe-service \
    --service-arn $(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='cloudexam-prep'].ServiceArn" --output text) \
    --query "Service.ServiceUrl" \
    --output text
```

Your app will be available at: `https://XXXXXXXX.us-east-1.awsapprunner.com`

## Method 2: Deploy from Source Code

### Prerequisites

```bash
# Install App Runner CLI plugin
aws apprunner help
```

### Deploy Directly

1. Create `apprunner.yaml` in project root:

```yaml
version: 1.0
runtime: nodejs18
build:
  commands:
    build:
      - cd client && npm ci && npm run build
      - cd .. && npm ci --only=production
run:
  runtime-version: 18
  command: node server/index.js
  network:
    port: 3000
  env:
    - name: NODE_ENV
      value: production
```

2. Deploy:

```bash
aws apprunner create-service \
    --service-name cloudexam-prep \
    --source-configuration '{
      "CodeRepository": {
        "RepositoryUrl": "https://github.com/YOUR_USERNAME/cloudexam-prep",
        "SourceCodeVersion": {
          "Type": "BRANCH",
          "Value": "main"
        },
        "CodeConfiguration": {
          "ConfigurationSource": "API",
          "CodeConfigurationValues": {
            "Runtime": "NODEJS_18",
            "BuildCommand": "npm run install:all && npm run build",
            "StartCommand": "NODE_ENV=production npm start",
            "Port": "3000"
          }
        }
      }
    }'
```

## Configuration

### Environment Variables

Set environment variables in App Runner:

```bash
aws apprunner update-service \
    --service-arn YOUR_SERVICE_ARN \
    --source-configuration '{
      "ImageRepository": {
        "ImageConfiguration": {
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "PORT": "3000"
          }
        }
      }
    }'
```

### Update Frontend URL

After deployment, update your frontend to use the production URL:

1. Create `client/.env.production`:

```env
VITE_SOCKET_URL=https://YOUR-APP-URL.us-east-1.awsapprunner.com
```

2. Rebuild and redeploy:

```bash
docker build -t cloudexam-prep .
docker tag cloudexam-prep:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:latest
```

App Runner will auto-deploy the new version.

## Scaling Configuration

### Auto Scaling

```bash
aws apprunner update-service \
    --service-arn YOUR_SERVICE_ARN \
    --auto-scaling-configuration-arn $(aws apprunner create-auto-scaling-configuration \
        --auto-scaling-configuration-name cloudexam-scaling \
        --max-concurrency 100 \
        --max-size 5 \
        --min-size 1 \
        --query AutoScalingConfiguration.AutoScalingConfigurationArn \
        --output text)
```

This configuration:
- Min instances: 1
- Max instances: 5
- Max concurrent requests per instance: 100

## Monitoring

### View Logs

```bash
# Get log streams
aws logs describe-log-streams \
    --log-group-name /aws/apprunner/cloudexam-prep/application

# View logs
aws logs tail /aws/apprunner/cloudexam-prep/application --follow
```

### CloudWatch Metrics

Monitor these metrics in CloudWatch:
- `2xxStatusCount` - Successful requests
- `4xxStatusCount` - Client errors
- `RequestCount` - Total requests
- `ActiveInstances` - Running instances
- `CPUUtilization` - CPU usage
- `MemoryUtilization` - Memory usage

## Custom Domain (Optional)

### Step 1: Associate Domain

```bash
aws apprunner associate-custom-domain \
    --service-arn YOUR_SERVICE_ARN \
    --domain-name exam.yourdomain.com
```

### Step 2: Add DNS Records

App Runner will provide validation records. Add them to your DNS:

```
Type: CNAME
Name: _apprunner-validation.exam
Value: VALIDATION_VALUE_FROM_AWS
```

```
Type: CNAME
Name: exam
Value: YOUR_APP_URL.us-east-1.awsapprunner.com
```

## Cost Optimization

### Pricing Breakdown

**App Runner Pricing (us-east-1):**
- Active time: $0.007/vCPU-hour + $0.00185/GB-hour
- Idle time: $0.0007/vCPU-hour + $0.000185/GB-hour

**Example Cost (1 vCPU, 2 GB, 24/7):**
- Active (8 hours/day): ~$10/month
- Idle (16 hours/day): ~$1/month
- **Total: ~$11/month**

### Reduce Costs

1. **Pause service** when not in use:
```bash
aws apprunner pause-service --service-arn YOUR_SERVICE_ARN
```

2. **Resume when needed:**
```bash
aws apprunner resume-service --service-arn YOUR_SERVICE_ARN
```

3. **Use smaller instances** for testing:
```json
{
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  }
}
```

## Troubleshooting

### Service Failed to Start

Check logs:
```bash
aws logs tail /aws/apprunner/cloudexam-prep/application
```

Common issues:
- Missing `questions.json` file
- Port mismatch (ensure port 3000)
- Node.js version mismatch

### WebSocket Connection Issues

Ensure:
1. Health check passes: `/health` returns 200
2. Socket.io is configured for production
3. CORS settings allow your domain

### High Memory Usage

Socket.io connections use memory. Adjust:
- Instance configuration: Increase to 3-4 GB
- Auto-scaling: Lower max concurrency

## Update Deployment

### Update Code

```bash
# Build new image
docker build -t cloudexam-prep .

# Tag with version
docker tag cloudexam-prep:latest \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:v1.1.0

# Push
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME:v1.1.0

# Update service (if auto-deploy is disabled)
aws apprunner start-deployment --service-arn YOUR_SERVICE_ARN
```

## Delete Service

```bash
# Delete App Runner service
aws apprunner delete-service --service-arn YOUR_SERVICE_ARN

# Delete ECR repository
aws ecr delete-repository \
    --repository-name cloudexam-prep \
    --force \
    --region $AWS_REGION
```

## Security Best Practices

1. **Use IAM roles** instead of hardcoded credentials
2. **Enable VPC connector** for private resources
3. **Use AWS Secrets Manager** for sensitive data
4. **Enable CloudTrail** for audit logs
5. **Set up WAF** for DDoS protection

## Production Checklist

- [ ] `questions.json` file included in image
- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] Custom domain configured (optional)
- [ ] CloudWatch alarms set up
- [ ] Backup strategy for questions
- [ ] Auto-scaling configured
- [ ] Monitoring dashboard created
- [ ] Cost alerts enabled

---

**Need Help?**
- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [Socket.io Production Best Practices](https://socket.io/docs/v4/production-checklist/)
- Check CloudWatch Logs for errors

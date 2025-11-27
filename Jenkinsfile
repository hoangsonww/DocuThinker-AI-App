pipeline {
  agent any

  environment {
    DOCUTHINKER_SYNC_GRAPH = "true"
    DOCUTHINKER_SYNC_VECTOR = "true"
    REGISTRY = "registry.example.com/docuthinker"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
    KUBE_NAMESPACE = "docuthinker"
    KUBE_CONTEXT = "docuthinker-prod"
    CANARY_WEIGHT = "10"
  }

  options {
    timestamps()
    ansiColor('xterm')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '25'))
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_SHA = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
          env.IMAGE_TAG = "${env.GIT_SHA}-${env.BUILD_NUMBER}"
        }
      }
    }

    stage('Environment Check') {
      steps {
        sh 'node -v || echo "Node.js not preset - relying on Jenkins toolchain"'
        sh 'python3 -V || python -V'
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
        dir('frontend') { sh 'npm ci' }
        dir('backend') { sh 'npm ci' }
        dir('ai_ml') { sh 'python3 -m pip install -r requirements.txt || pip install -r requirements.txt' }
      }
    }

    stage('Lint & Unit Tests') {
      parallel {
        stage('Frontend Tests') {
          steps { dir('frontend') { sh 'npm run test -- --watch=false' } }
        }
        stage('Backend Tests') {
          steps { dir('backend') { sh 'npm run test' } }
        }
        stage('AI/ML Static Checks') {
          steps {
            dir('ai_ml') {
              sh 'python -m compileall .'
            }
          }
        }
      }
    }

    stage('Build') {
      parallel {
        stage('Frontend Build') {
          steps { dir('frontend') { sh 'npm run build' } }
        }
        stage('Backend Build') {
          steps { dir('backend') { sh 'npm run build' } }
        }
      }
    }

    stage('Docker Build & Push') {
      when { branch "main" }
      steps {
        withCredentials([usernamePassword(credentialsId: 'docuthinker-registry', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          sh '''
            set -euo pipefail
            REGISTRY_HOST=$(echo $REGISTRY | cut -d'/' -f1)
            echo "$REG_PASS" | docker login "$REGISTRY_HOST" -u "$REG_USER" --password-stdin
            docker build -t $REGISTRY/backend:$IMAGE_TAG backend
            docker build -t $REGISTRY/frontend:$IMAGE_TAG frontend
            docker push $REGISTRY/backend:$IMAGE_TAG
            docker push $REGISTRY/frontend:$IMAGE_TAG
          '''
        }
      }
    }

    stage('Deploy Canary to Kubernetes') {
      when { branch "main" }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-docuthinker', variable: 'KUBECONFIG_FILE')]) {
          withEnv(["KUBECONFIG=${KUBECONFIG_FILE}"]) {
            script {
              def current = sh(returnStdout: true, script: "kubectl --context=${env.KUBE_CONTEXT} -n ${env.KUBE_NAMESPACE} get svc backend-service -o jsonpath='{.spec.selector.track}' 2>/dev/null || echo blue").trim()
              env.CURRENT_COLOR = current ?: "blue"
              env.TARGET_COLOR = (env.CURRENT_COLOR == "blue") ? "green" : "blue"
            }
            sh '''
              set -euo pipefail
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/configmap.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/backend-service.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/frontend-service.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/backend-canary-service.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/frontend-canary-service.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/ingress.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE annotate ingress docuthinker-canary-ingress nginx.ingress.kubernetes.io/canary-weight="$CANARY_WEIGHT" --overwrite
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/backend-deployment-blue.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/frontend-deployment-blue.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/backend-deployment-green.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/frontend-deployment-green.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/backend-deployment-canary.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE apply -f kubernetes/frontend-deployment-canary.yaml
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE scale deployment/backend-$TARGET_COLOR --replicas=3
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE scale deployment/frontend-$TARGET_COLOR --replicas=3
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE set image deployment/backend-$TARGET_COLOR backend=$REGISTRY/backend:$IMAGE_TAG
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE set image deployment/frontend-$TARGET_COLOR frontend=$REGISTRY/frontend:$IMAGE_TAG
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE set image deployment/backend-canary backend=$REGISTRY/backend:$IMAGE_TAG
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE set image deployment/frontend-canary frontend=$REGISTRY/frontend:$IMAGE_TAG
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE rollout status deployment/backend-$TARGET_COLOR --timeout=120s
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE rollout status deployment/frontend-$TARGET_COLOR --timeout=120s
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE rollout status deployment/backend-canary --timeout=120s
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE rollout status deployment/frontend-canary --timeout=120s
            '''
          }
        }
      }
    }

    stage('Canary Verification') {
      when { branch "main" }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-docuthinker', variable: 'KUBECONFIG_FILE')]) {
          withEnv(["KUBECONFIG=${KUBECONFIG_FILE}"]) {
            sh '''
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE get pods -l track=canary -o wide
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE describe ingress docuthinker-canary-ingress || true
            '''
          }
        }
        input message: "Promote $IMAGE_TAG to ${TARGET_COLOR} (blue/green) after canary soak?", ok: "Promote"
      }
    }

    stage('Promote to Blue/Green') {
      when { branch "main" }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-docuthinker', variable: 'KUBECONFIG_FILE')]) {
          withEnv(["KUBECONFIG=${KUBECONFIG_FILE}"]) {
            sh '''
              set -euo pipefail
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE patch service backend-service -p "{\"spec\": {\"selector\": {\"app\": \"backend\", \"track\": \"${TARGET_COLOR}\"}}}"
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE patch service frontend-service -p "{\"spec\": {\"selector\": {\"app\": \"frontend\", \"track\": \"${TARGET_COLOR}\"}}}"
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE rollout status deployment/backend-$TARGET_COLOR --timeout=120s
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE rollout status deployment/frontend-$TARGET_COLOR --timeout=120s
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE scale deployment/backend-$CURRENT_COLOR --replicas=0
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE scale deployment/frontend-$CURRENT_COLOR --replicas=0
            '''
          }
        }
      }
    }

    stage('Smoke Tests Post-Promotion') {
      when { branch "main" }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-docuthinker', variable: 'KUBECONFIG_FILE')]) {
          withEnv(["KUBECONFIG=${KUBECONFIG_FILE}"]) {
            sh '''
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE get svc backend-service -o wide
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE get svc frontend-service -o wide
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE get deploy -l app=backend -o wide
              kubectl --context=$KUBE_CONTEXT -n $KUBE_NAMESPACE get deploy -l app=frontend -o wide
            '''
          }
        }
      }
    }

    stage('Deploy to Vercel (legacy/fallback)') {
      when { branch "main" }
      steps {
        withCredentials([string(credentialsId: 'vercel-token', variable: 'VERCEL_TOKEN')]) {
          sh 'npx vercel --token=$VERCEL_TOKEN --prod'
        }
      }
    }
  }

  post {
    always {
      sh 'docker logout $(echo $REGISTRY | cut -d"/" -f1) || true'
    }
  }
}

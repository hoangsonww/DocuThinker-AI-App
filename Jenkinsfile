pipeline {
  agent any

  environment {
    DOCUTHINKER_SYNC_GRAPH = "true"
    DOCUTHINKER_SYNC_VECTOR = "true"
  }

  options {
    timestamps()
    ansiColor('xterm')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
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
        sh 'npm install'
        dir('frontend') { sh 'npm install' }
        dir('backend') { sh 'npm install' }
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

    stage('Package Artifacts') {
      steps {
        sh 'mkdir -p artifacts'
        sh 'cp -R frontend/.next artifacts/frontend-build'
        sh 'cp -R backend/dist artifacts/backend-build'
        sh 'cp -R ai_ml artifacts/ai-ml'
      }
    }

    stage('Deploy to Vercel') {
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
      sh 'rm -rf artifacts'
    }
  }
}

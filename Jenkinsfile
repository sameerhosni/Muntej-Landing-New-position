pipeline {
    agent {
        kubernetes {
            cloud('kubernetes-production')
            defaultContainer 'jenkins-agent'
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    agent: jenkins-agent
  namespace: jenkins
spec:
  serviceAccountName: jenkins-admin
  nodeSelector:
    product: mrhr
  tolerations:
    - key: product
      operator: Equal
      value: mrhr
      effect: NoSchedule
  imagePullSecrets:
    - name: regcred
  volumes:
    - name: kaniko-secret
      secret:
        secretName: regcred
        items:
          - key: .dockerconfigjson
            path: config.json
  containers:
    - name: kaniko
      image: gcr.io/kaniko-project/executor:v1.24.0-debug
      tty: true
      command:
        - /busybox/cat
      volumeMounts:
        - name: kaniko-secret
          mountPath: /kaniko/.docker
      resources:
        limits:
          cpu: "2000m"
          memory: "4Gi"
          ephemeral-storage: "8Gi"
        requests:
          cpu: "1000m"
          memory: "3Gi"
          ephemeral-storage: "4Gi"
    - name: jenkins-agent
      image: 180526211356.dkr.ecr.eu-central-1.amazonaws.com/devops-agent:latest
      command:
        - cat
      tty: true
      resources:
        limits:
          cpu: "1000m"
          memory: "1Gi"
        requests:
          cpu: "100m"
          memory: "256Mi"
'''
        }
    }

    options {
        disableConcurrentBuilds()
    }

    environment {
        ECR_URL       = "180526211356.dkr.ecr.eu-central-1.amazonaws.com"
        YAML_BRANCH   = "main"
        YAML_REPO     = "https://x-bitbucket-api-token-auth@bitbucket.org/t2pms/devops_repo.git"
        WEB_IMAGE     = "prod-adeed-assistant-web"
        API_IMAGE     = "prod-adeed-assistant-api"
        K8S_NAMESPACE = "prod-adeed"
        YAML_DIR      = "k8s-manifests/apps/adeed_assistant/prod"
    }

    stages {
        stage('Prepare') {
            steps {
                script {
                    env.IMAGE_TAG = "${env.GIT_COMMIT.take(7)}-${env.BUILD_NUMBER}"
                    echo "IMAGE_TAG=${env.IMAGE_TAG}"
                    echo "K8S_NAMESPACE=${env.K8S_NAMESPACE}"
                    echo "YAML_DIR=${env.YAML_DIR}"
                }
            }
        }

        stage('Build Website Image') {
            environment {
                PATH = "/busybox:/kaniko:$PATH"
            }
            steps {
                container(name: 'kaniko', shell: '/busybox/sh') {
                    sh '''
                        /kaniko/executor \
                          --context=./ \
                          --dockerfile=Dockerfile.web \
                          --destination=$ECR_URL/$WEB_IMAGE:$IMAGE_TAG \
                          --snapshot-mode=time \
                          --use-new-run \
                          --cleanup
                    '''
                }
            }
        }

        stage('Build API Image') {
            environment {
                PATH = "/busybox:/kaniko:$PATH"
            }
            steps {
                container(name: 'kaniko', shell: '/busybox/sh') {
                    sh '''
                        /kaniko/executor \
                          --context=./ \
                          --dockerfile=Dockerfile.api \
                          --destination=$ECR_URL/$API_IMAGE:$IMAGE_TAG \
                          --snapshot-mode=time \
                          --use-new-run \
                          --cleanup
                    '''
                }
            }
        }

        stage('Deploy To Kubernetes') {
            steps {
                container('jenkins-agent') {
                    dir('devops') {
                        git(
                            branch: env.YAML_BRANCH,
                            credentialsId: 'bb-devops-sa',
                            url: env.YAML_REPO
                        )
                        sh '''
                            sed -i "s|<TAG>|$IMAGE_TAG|g" $YAML_DIR/deployment.yaml
                            kubectl -n $K8S_NAMESPACE apply -f $YAML_DIR/
                            kubectl -n $K8S_NAMESPACE rollout status deployment/prod-adeed-assistant-web --timeout=180s
                            kubectl -n $K8S_NAMESPACE rollout status deployment/prod-adeed-assistant-api --timeout=180s
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded'
        }
        failure {
            echo 'Pipeline failed'
        }
    }
}

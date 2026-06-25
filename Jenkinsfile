pipeline {
    agent any

    /**********************************************
     * STABLE ENVIRONMENT VARIABLES
     **********************************************/
    environment {
        GITHUB_CREDENTIAL = credentials('github-access-token')
        GITHUB_URL = "https://${GITHUB_CREDENTIAL}@github.com/MartBey/accvictory.git"
        GITHUB_BRANCH = 'main'
    }

    stages {

        /**********************************************
         * 0. CHECKOUT CODE FROM GITHUB
         **********************************************/
        stage('0. CLEAN WORKSPACE') {
            steps {
                cleanWs()
            }
        }

        /**********************************************
         * 1. CHECKOUT CODE FROM GITHUB
         **********************************************/
        stage('1. CHECKOUT CODE') {
            steps {
                sh 'git config --global http.sslVerify false'

                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "${GITHUB_BRANCH}"]],
                    userRemoteConfigs: [[
                        credentialsId: "${GITHUB_CREDENTIAL}",
                        url: "${GITHUB_URL}"
                    ]]
                ])

                sh "git checkout ${GITHUB_BRANCH}"
            }
        }

        /**********************************************
         * 2. BUILD AND RUN DOCKER IMAGE
         **********************************************/
        stage('2. BUILD AND RUN DOCKER IMAGE') {
            steps {
                script {
                    sh """
                        echo '[CLEANUP] Pruning Docker build cache...'
                        docker builder prune -af || true
                        docker system prune -f || true

                        echo '[BUILD] Building Docker image...'
                        cp .env.local.backup .env
                        docker-compose build --no-cache
                        docker-compose up --detach --force-recreate --remove-orphans --always-recreate-deps --renew-anon-volumes
                        echo '[BUILD] Docker image built.'
                    """
                }
            }
        }

        /**********************************************
         * 3. CLEAN WORKSPACE AFTER BUILD
         **********************************************/
        stage('3. CLEAN WORKSPACE (After Build)') {
            steps {
                script {
                    sh """
                        docker system prune -f || true
                        echo '[CLEANUP] Post-build cleanup completed.'
                    """
                }
            }
        }
    }
}

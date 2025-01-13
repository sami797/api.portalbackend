pipeline {
    agent any

    stages {
        // stage('Checkout') {
        //     steps {
        //      // Check out the source code from your version control system
        //         checkout scm
        //     }
        // }

        stage('Build') {
            steps {
                // Install Node.js dependencies and build the Nest.js application
                script {
                    sh 'npm install'
                    sh 'npm run build'  // Adjust the build command based on your project setup
                }
            }
        }

        stage('Deploy') {
            steps {
                // Restart the PM2 process
                script {
                    // Assuming PM2 is globally installed, if not, adjust the path accordingly
                    sh 'pm2 restart 18'  // Replace '18' with your PM2 process ID
                }
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully'
        }
        failure {
            echo 'CI/CD pipeline failed. Please check logs for details'
        }
    }
}
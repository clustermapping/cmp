ssh -i ~/.ssh/hbstemp.pem ec2-user@107.20.30.141

cd /opt/development/hbs/clustermapping/data/processing/; node --expose_gc --max-old-space-size=8192 import.js /opt/process/data /opt/process/output ; cd /opt/process/data/; ./delete.sh all localhost; ./uploadsolr.sh /opt/process/output localhost;
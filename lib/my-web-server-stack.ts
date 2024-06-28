import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class MyWebServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC creation
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 1, // Default is all AZs in the region
    });

    // Security group for the EC2 instance
    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,
      securityGroupName: 'web-server-sg',
      description: 'Allow HTTP and SSH access',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow SSH access from anywhere');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow HTTP access from anywhere');

    // IAM role for the EC2 instance
    const role = new iam.Role(this, 'MyEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    // Amazon Linux 2 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2();

    // EC2 instance
    new ec2.Instance(this, 'MyWebServer', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      machineImage: ami,
      securityGroup: securityGroup,
      role: role,
    });
  }
}

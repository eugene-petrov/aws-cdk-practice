import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class DemoEc2InstanceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc:cdk.aws_ec2.Vpc = this.createVPC();
        const securityGroup:cdk.aws_ec2.SecurityGroup = this.createSecurityGroup(vpc);
        const role:cdk.aws_iam.Role = this.createRole();

        this.createEC2Instance(vpc, securityGroup, role);
    }

    private createVPC():cdk.aws_ec2.Vpc {
        return new ec2.Vpc(this, 'MyVpc', {
            maxAzs: 1, // Default is all AZs in the region
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public-subnet',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'private-subnet',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
        });
    }

    private createSecurityGroup(vpc:cdk.aws_ec2.Vpc):cdk.aws_ec2.SecurityGroup {
        const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
            vpc,
            securityGroupName: 'web-server-sg',
            description: 'Allow HTTP and SSH access',
            allowAllOutbound: true,
        });
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow SSH access from anywhere');
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow HTTP access from anywhere');

        return securityGroup;
    }

    private createRole():cdk.aws_iam.Role {
        const role = new iam.Role(this, 'MyEc2Role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        });
        role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        return role;
    }

    private createEC2Instance(vpc:cdk.aws_ec2.Vpc, securityGroup:cdk.aws_ec2.SecurityGroup, role:cdk.aws_iam.Role) {
        new ec2.Instance(this, 'MyWebServer', {
            vpc,
            instanceType: new ec2.InstanceType('t2.micro'),
            machineImage: ec2.MachineImage.latestAmazonLinux2(),
            securityGroup: securityGroup,
            role: role,
            keyPair: ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'my-web-server'),
            vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
        });
    }
}

from rest_framework import serializers
from django.contrib.auth import authenticate
import re
from .models import User, Department

def validate_password_complexity(password):
    if len(password) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    if not re.search(r'[A-Z]', password):
        raise serializers.ValidationError("Password must contain at least one uppercase letter.")
    if not re.search(r'\d', password):
        raise serializers.ValidationError("Password must contain at least one number.")
    if not re.search(r'[^A-Za-z0-9]', password):
        raise serializers.ValidationError("Password must contain at least one special character.")
    return password

def validate_phone_number(phone):
    if phone and not re.fullmatch(r'\d{10}', phone):
        raise serializers.ValidationError("Mobile number must be exactly 10 digits.")
    return phone


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description']


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'department', 'department_name', 'phone',
            'profile_picture', 'is_active', 'date_joined'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def get_full_name(self, obj):
        return obj.get_full_name()

    def validate_phone(self, value):
        return validate_phone_number(value)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'role',
            'department', 'phone', 'password', 'confirm_password'
        ]

    def validate(self, data):
        if data.get('password') and data.get('confirm_password'):
            if data['password'] != data['confirm_password']:
                raise serializers.ValidationError("Passwords don't match.")
            validate_password_complexity(data['password'])
            
        if data.get('phone'):
            validate_phone_number(data['phone'])
            
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField()

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        validate_password_complexity(data['new_password'])
        return data

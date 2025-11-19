import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Upload, X, Video as VideoIcon, CheckCircle, Landmark, Building, Coffee, Wrench, Store, Users, ChevronDown } from 'lucide-react';
import CurrencyInput from '@/components/ui/currency-input';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { VendorCreationDialog } from '@/components/VendorCreationDialog';
import { cn } from '@/lib/utils';
import { useDistanceUnit } from '@/hooks/use-distance-unit';

// Comprehensive Category System - All Products, Services, and Digital Products Known to Humanity
const PRODUCT_CATEGORIES = [
  { value: 'vehicles-cars', label: 'Cars & Automobiles', fields: ['make', 'model', 'year', 'mileage', 'fuel_type', 'transmission', 'condition'] },
  { value: 'vehicles-motorcycles', label: 'Motorcycles', fields: ['make', 'model', 'year', 'mileage', 'engine_size', 'condition'] },
  { value: 'vehicles-boats', label: 'Boats & Marine', fields: ['make', 'model', 'year', 'length', 'engine_type', 'condition'] },
  { value: 'electronics-phones', label: 'Mobile Phones', fields: ['brand', 'model', 'storage', 'color', 'condition', 'warranty'] },
  { value: 'electronics-computers', label: 'Computers & Laptops', fields: ['brand', 'model', 'processor', 'ram', 'storage', 'screen_size', 'condition'] },
  { value: 'electronics-tablets', label: 'Tablets', fields: ['brand', 'model', 'storage', 'screen_size', 'condition'] },
  { value: 'electronics-cameras', label: 'Cameras', fields: ['brand', 'model', 'megapixels', 'lens_type', 'condition'] },
  { value: 'electronics-audio', label: 'Audio & Headphones', fields: ['brand', 'model', 'type', 'wireless', 'condition'] },
  { value: 'electronics-tv', label: 'TVs & Monitors', fields: ['brand', 'screen_size', 'resolution', 'smart_tv', 'condition'] },
  { value: 'electronics-gaming', label: 'Gaming Consoles', fields: ['brand', 'model', 'storage', 'condition'] },
  { value: 'fashion-mens', label: 'Men\'s Clothing', fields: ['brand', 'size', 'color', 'material', 'condition'] },
  { value: 'fashion-womens', label: 'Women\'s Clothing', fields: ['brand', 'size', 'color', 'material', 'condition'] },
  { value: 'fashion-kids', label: 'Kids Clothing', fields: ['brand', 'age_group', 'size', 'color', 'condition'] },
  { value: 'fashion-shoes', label: 'Shoes & Footwear', fields: ['brand', 'size', 'color', 'material', 'condition'] },
  { value: 'fashion-accessories', label: 'Fashion Accessories', fields: ['brand', 'type', 'material', 'condition'] },
  { value: 'fashion-watches', label: 'Watches & Jewelry', fields: ['brand', 'material', 'gender', 'condition'] },
  { value: 'home-furniture', label: 'Furniture', fields: ['material', 'dimensions', 'color', 'condition'] },
  { value: 'home-appliances', label: 'Home Appliances', fields: ['brand', 'model', 'energy_rating', 'condition'] },
  { value: 'home-decor', label: 'Home Decor', fields: ['material', 'dimensions', 'color'] },
  { value: 'home-kitchen', label: 'Kitchen & Dining', fields: ['material', 'brand', 'condition'] },
  { value: 'home-garden', label: 'Garden & Outdoor', fields: ['material', 'dimensions', 'condition'] },
  { value: 'home-tools', label: 'Tools & Hardware', fields: ['brand', 'type', 'power_source', 'condition'] },
  { value: 'sports-equipment', label: 'Sports Equipment', fields: ['sport', 'brand', 'size', 'condition'] },
  { value: 'sports-fitness', label: 'Fitness Equipment', fields: ['brand', 'type', 'weight_capacity', 'condition'] },
  { value: 'books-fiction', label: 'Fiction Books', fields: ['author', 'publisher', 'isbn', 'pages', 'language', 'condition'] },
  { value: 'books-nonfiction', label: 'Non-Fiction Books', fields: ['author', 'publisher', 'isbn', 'pages', 'language', 'condition'] },
  { value: 'books-textbooks', label: 'Textbooks', fields: ['author', 'publisher', 'isbn', 'edition', 'subject', 'condition'] },
  { value: 'realestate-residential', label: 'Residential Property', fields: ['property_type', 'bedrooms', 'bathrooms', 'size_sqft', 'year_built'] },
  { value: 'realestate-commercial', label: 'Commercial Property', fields: ['property_type', 'size_sqft', 'year_built', 'zoning'] },
  { value: 'food-fresh', label: 'Fresh Food', fields: ['origin', 'organic', 'expiry_date', 'weight'] },
  { value: 'food-packaged', label: 'Packaged Foods', fields: ['brand', 'expiry_date', 'weight', 'allergens'] },
  { value: 'beauty-skincare', label: 'Skincare', fields: ['brand', 'skin_type', 'volume', 'expiry_date'] },
  { value: 'beauty-makeup', label: 'Makeup', fields: ['brand', 'shade', 'type', 'expiry_date'] },
  { value: 'toys-kids', label: 'Kids Toys', fields: ['age_range', 'brand', 'condition'] },
  { value: 'pets-food', label: 'Pet Food', fields: ['pet_type', 'brand', 'weight', 'expiry_date'] },
  { value: 'pets-accessories', label: 'Pet Accessories', fields: ['pet_type', 'brand', 'size'] },
  { value: 'office-supplies', label: 'Office Supplies', fields: ['brand', 'quantity'] },
];

const SERVICE_CATEGORIES = [
  { value: 'services-legal', label: 'Legal Services', fields: ['specialization', 'years_experience', 'certification', 'hourly_rate'] },
  { value: 'services-accounting', label: 'Accounting', fields: ['specialization', 'years_experience', 'hourly_rate'] },
  { value: 'services-consulting', label: 'Business Consulting', fields: ['industry', 'years_experience', 'hourly_rate'] },
  { value: 'services-design', label: 'Design Services', fields: ['specialization', 'portfolio_link', 'hourly_rate'] },
  { value: 'services-writing', label: 'Writing & Translation', fields: ['languages', 'specialization', 'word_rate'] },
  { value: 'services-photography', label: 'Photography', fields: ['specialization', 'equipment', 'session_rate'] },
  { value: 'services-cleaning', label: 'Cleaning Services', fields: ['service_type', 'area_coverage', 'hourly_rate'] },
  { value: 'services-plumbing', label: 'Plumbing', fields: ['certification', 'years_experience', 'hourly_rate'] },
  { value: 'services-electrical', label: 'Electrical Services', fields: ['certification', 'years_experience', 'hourly_rate'] },
  { value: 'services-tutoring', label: 'Tutoring', fields: ['subject', 'level', 'years_experience', 'hourly_rate'] },
  { value: 'services-fitness', label: 'Personal Training', fields: ['specialization', 'certification', 'session_rate'] },
  { value: 'services-it', label: 'IT Support', fields: ['specialization', 'certification', 'hourly_rate'] },
  { value: 'services-auto-repair', label: 'Auto Repair', fields: ['specialization', 'certification', 'hourly_rate'] },
  { value: 'services-catering', label: 'Catering', fields: ['cuisine_type', 'capacity', 'per_person_rate'] },
];

const GOVERNMENT_SERVICE_CATEGORIES = [
  { value: 'gov-document', label: 'Document', fields: ['document_type', 'processing_time', 'requirements'] },
  { value: 'gov-certificate', label: 'Certificate', fields: ['service_type', 'processing_time', 'requirements'] },
  { value: 'gov-translation', label: 'Translation', fields: ['language_from', 'language_to', 'processing_time'] },
  { value: 'gov-notary', label: 'Notary', fields: ['notary_type', 'processing_time', 'requirements'] },
];

const DIGITAL_CATEGORIES = [
  { value: 'digital-software', label: 'Software & Apps', fields: ['platform', 'version', 'license_type', 'file_size'] },
  { value: 'digital-ebooks', label: 'E-books', fields: ['author', 'pages', 'format', 'language'] },
  { value: 'digital-music', label: 'Music & Audio', fields: ['artist', 'genre', 'duration', 'format'] },
  { value: 'digital-video', label: 'Videos', fields: ['genre', 'duration', 'resolution', 'format'] },
  { value: 'digital-photos', label: 'Stock Photos', fields: ['resolution', 'format', 'license_type'] },
  { value: 'digital-courses', label: 'Online Courses', fields: ['subject', 'duration', 'level', 'certificate'] },
  { value: 'digital-graphics', label: 'Graphics & Templates', fields: ['software_required', 'format', 'license_type'] },
  { value: 'digital-games', label: 'Digital Games', fields: ['platform', 'genre', 'multiplayer'] },
];

// Lifestyle Categories - For food ordering, groceries, and reservations
const LIFESTYLE_FOOD_CATEGORIES = [
  { value: 'lifestyle-restaurant', label: 'Restaurant Food', fields: ['cuisine_type', 'meal_type', 'spice_level', 'dietary_options', 'preparation_time'] },
  { value: 'lifestyle-fast-food', label: 'Fast Food', fields: ['cuisine_type', 'meal_type', 'preparation_time'] },
  { value: 'lifestyle-bakery', label: 'Bakery & Desserts', fields: ['item_type', 'allergens', 'expiry_date'] },
  { value: 'lifestyle-beverages', label: 'Beverages', fields: ['beverage_type', 'volume', 'temperature'] },
];

const LIFESTYLE_GROCERY_CATEGORIES = [
  { value: 'grocery-fresh-produce', label: 'Fresh Produce', fields: ['origin', 'organic', 'weight', 'expiry_date'] },
  { value: 'grocery-dairy', label: 'Dairy & Eggs', fields: ['brand', 'weight', 'expiry_date', 'storage_temp'] },
  { value: 'grocery-meat', label: 'Meat & Seafood', fields: ['meat_type', 'cut', 'weight', 'expiry_date'] },
  { value: 'grocery-pantry', label: 'Pantry Staples', fields: ['brand', 'weight', 'expiry_date'] },
  { value: 'grocery-snacks', label: 'Snacks & Treats', fields: ['brand', 'weight', 'allergens', 'expiry_date'] },
  { value: 'grocery-frozen', label: 'Frozen Foods', fields: ['brand', 'weight', 'expiry_date'] },
];

const LIFESTYLE_RESERVATION_CATEGORIES = [
  { value: 'reservation-restaurant', label: 'Restaurant Reservation', fields: ['restaurant_name', 'cuisine_type', 'seating_capacity', 'time_slot', 'location'] },
  { value: 'reservation-hotel', label: 'Hotel Booking', fields: ['hotel_name', 'room_type', 'check_in', 'check_out', 'location'] },
  { value: 'reservation-event', label: 'Event Booking', fields: ['event_name', 'event_type', 'venue', 'date_time', 'capacity'] },
  { value: 'reservation-spa', label: 'Spa & Wellness', fields: ['spa_service_type', 'duration', 'time_slot'] },
];

// Services Categories - For jobs and freelance work
const JOBS_CATEGORIES = [
  { value: 'job-fulltime', label: 'Full-time Position', fields: ['job_title', 'employment_type', 'experience_level', 'salary_range', 'skills_required', 'education_required', 'job_location'] },
  { value: 'job-parttime', label: 'Part-time Position', fields: ['job_title', 'employment_type', 'experience_level', 'hourly_rate', 'skills_required', 'job_location'] },
  { value: 'job-contract', label: 'Contract Position', fields: ['job_title', 'contract_duration', 'experience_level', 'salary_range', 'skills_required', 'job_location'] },
  { value: 'job-internship', label: 'Internship', fields: ['job_title', 'internship_duration', 'experience_level', 'stipend_amount', 'skills_required', 'education_required'] },
  { value: 'job-remote', label: 'Remote Job', fields: ['job_title', 'employment_type', 'experience_level', 'salary_range', 'skills_required', 'time_zone'] },
];

const FREELANCE_CATEGORIES = [
  { value: 'freelance-webdev', label: 'Web Development', fields: ['project_title', 'project_duration', 'budget_range', 'tech_stack', 'experience_required', 'portfolio_required'] },
  { value: 'freelance-design', label: 'Graphic Design', fields: ['project_title', 'project_duration', 'budget_range', 'design_tools', 'deliverables', 'portfolio_required'] },
  { value: 'freelance-writing', label: 'Content Writing', fields: ['project_title', 'word_count', 'budget_range', 'content_type', 'deadline', 'samples_required'] },
  { value: 'freelance-marketing', label: 'Digital Marketing', fields: ['project_title', 'project_duration', 'budget_range', 'marketing_channels', 'experience_required'] },
  { value: 'freelance-video', label: 'Video Editing', fields: ['project_title', 'video_length', 'budget_range', 'editing_software', 'deliverables', 'deadline'] },
  { value: 'freelance-consulting', label: 'Consulting', fields: ['project_title', 'consulting_area', 'project_duration', 'budget_range', 'experience_required'] },
];

// Field configuration for dynamic rendering
const FIELD_CONFIGS: Record<string, {label: string; type: string; placeholder?: string; options?: string[]}> = {
  make: { label: 'Make', type: 'text', placeholder: 'e.g., Toyota' },
  model: { label: 'Model', type: 'text', placeholder: 'e.g., Camry' },
  year: { label: 'Year', type: 'number', placeholder: 'e.g., 2020' },
  mileage: { label: 'Mileage', type: 'number', placeholder: 'e.g., 50000' },
  fuel_type: { label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
  transmission: { label: 'Transmission', type: 'select', options: ['Automatic', 'Manual', 'CVT'] },
  engine_size: { label: 'Engine (cc)', type: 'number', placeholder: 'e.g., 1500' },
  brand: { label: 'Brand', type: 'text', placeholder: 'Brand name' },
  storage: { label: 'Storage', type: 'select', options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'] },
  processor: { label: 'Processor', type: 'text', placeholder: 'e.g., Intel i7' },
  ram: { label: 'RAM', type: 'select', options: ['4GB', '8GB', '16GB', '32GB'] },
  screen_size: { label: 'Screen (inches)', type: 'number', placeholder: 'e.g., 15.6' },
  resolution: { label: 'Resolution', type: 'select', options: ['HD', 'Full HD', '2K', '4K'] },
  megapixels: { label: 'Megapixels', type: 'number', placeholder: 'e.g., 24' },
  lens_type: { label: 'Lens Type', type: 'text', placeholder: 'e.g., 18-55mm' },
  wireless: { label: 'Wireless', type: 'select', options: ['Yes', 'No'] },
  smart_tv: { label: 'Smart TV', type: 'select', options: ['Yes', 'No'] },
  size: { label: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  color: { label: 'Color', type: 'text', placeholder: 'e.g., Black' },
  material: { label: 'Material', type: 'text', placeholder: 'e.g., Cotton' },
  gender: { label: 'Gender', type: 'select', options: ['Men', 'Women', 'Unisex'] },
  age_group: { label: 'Age Group', type: 'text', placeholder: 'e.g., 5-7 years' },
  property_type: { label: 'Type', type: 'select', options: ['House', 'Apartment', 'Condo', 'Villa', 'Office', 'Shop'] },
  bedrooms: { label: 'Bedrooms', type: 'number', placeholder: 'e.g., 3' },
  bathrooms: { label: 'Bathrooms', type: 'number', placeholder: 'e.g., 2' },
  size_sqft: { label: 'Size (sq ft)', type: 'number', placeholder: 'e.g., 1200' },
  year_built: { label: 'Year Built', type: 'number', placeholder: 'e.g., 2015' },
  condition: { label: 'Condition', type: 'select', options: ['New', 'Like New', 'Excellent', 'Good', 'Fair'] },
  warranty: { label: 'Warranty (months)', type: 'number', placeholder: 'e.g., 12' },
  energy_rating: { label: 'Energy Rating', type: 'select', options: ['A+++', 'A++', 'A+', 'A', 'B', 'C'] },
  dimensions: { label: 'Dimensions', type: 'text', placeholder: 'L × W × H' },
  type: { label: 'Type', type: 'text', placeholder: 'Type/Category' },
  power_source: { label: 'Power Source', type: 'select', options: ['Electric', 'Battery', 'Manual', 'Gas'] },
  sport: { label: 'Sport', type: 'text', placeholder: 'e.g., Soccer' },
  weight_capacity: { label: 'Weight Capacity (kg)', type: 'number', placeholder: 'e.g., 150' },
  author: { label: 'Author', type: 'text', placeholder: 'Author name' },
  publisher: { label: 'Publisher', type: 'text', placeholder: 'Publisher name' },
  isbn: { label: 'ISBN', type: 'text', placeholder: 'ISBN number' },
  pages: { label: 'Pages', type: 'number', placeholder: 'e.g., 350' },
  language: { label: 'Language', type: 'text', placeholder: 'e.g., English' },
  edition: { label: 'Edition', type: 'text', placeholder: 'e.g., 5th Edition' },
  subject: { label: 'Subject', type: 'text', placeholder: 'e.g., Mathematics' },
  origin: { label: 'Origin', type: 'text', placeholder: 'Country/Region' },
  organic: { label: 'Organic', type: 'select', options: ['Yes', 'No'] },
  expiry_date: { label: 'Expiry Date', type: 'date' },
  weight: { label: 'Weight', type: 'text', placeholder: 'e.g., 1kg' },
  allergens: { label: 'Allergens', type: 'text', placeholder: 'e.g., Nuts, Dairy' },
  skin_type: { label: 'Skin Type', type: 'select', options: ['All', 'Oily', 'Dry', 'Combination', 'Sensitive'] },
  volume: { label: 'Volume', type: 'text', placeholder: 'e.g., 50ml' },
  shade: { label: 'Shade/Color', type: 'text', placeholder: 'e.g., Natural Beige' },
  age_range: { label: 'Age Range', type: 'text', placeholder: 'e.g., 3-5 years' },
  pet_type: { label: 'Pet Type', type: 'select', options: ['Dog', 'Cat', 'Bird', 'Fish', 'Other'] },
  quantity: { label: 'Quantity', type: 'number', placeholder: 'e.g., 100' },
  zoning: { label: 'Zoning', type: 'text', placeholder: 'e.g., Commercial' },
  length: { label: 'Length (ft)', type: 'number', placeholder: 'e.g., 25' },
  engine_type: { label: 'Engine Type', type: 'text', placeholder: 'e.g., Outboard' },
  specialization: { label: 'Specialization', type: 'text', placeholder: 'Your expertise' },
  years_experience: { label: 'Experience (years)', type: 'number', placeholder: 'e.g., 5' },
  certification: { label: 'Certifications', type: 'text', placeholder: 'Professional certs' },
  hourly_rate: { label: 'Hourly Rate', type: 'number', placeholder: 'e.g., 50' },
  industry: { label: 'Industry', type: 'text', placeholder: 'e.g., Tech' },
  portfolio_link: { label: 'Portfolio URL', type: 'text', placeholder: 'https://...' },
  word_rate: { label: 'Rate per Word', type: 'number', placeholder: 'e.g., 0.05' },
  languages: { label: 'Languages', type: 'text', placeholder: 'e.g., EN, FR' },
  equipment: { label: 'Equipment', type: 'text', placeholder: 'Camera models' },
  session_rate: { label: 'Session Rate', type: 'number', placeholder: 'e.g., 200' },
  service_type: { label: 'Service Type', type: 'select', options: ['Birth Certificate', 'Marriage Certificate', 'Death Certificate'] },
  area_coverage: { label: 'Coverage Area', type: 'text', placeholder: 'Cities/Regions' },
  level: { label: 'Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
  platform: { label: 'Platform', type: 'select', options: ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Web'] },
  version: { label: 'Version', type: 'text', placeholder: 'e.g., 2.0' },
  file_size: { label: 'File Size (MB)', type: 'number', placeholder: 'e.g., 150' },
  format: { label: 'Format', type: 'text', placeholder: 'e.g., PDF, MP3' },
  artist: { label: 'Artist', type: 'text', placeholder: 'Artist name' },
  genre: { label: 'Genre', type: 'text', placeholder: 'e.g., Pop' },
  duration: { label: 'Duration', type: 'text', placeholder: 'e.g., 45 min' },
  certificate: { label: 'Certificate', type: 'select', options: ['Yes', 'No'] },
  software_required: { label: 'Software Required', type: 'text', placeholder: 'e.g., Photoshop' },
  multiplayer: { label: 'Multiplayer', type: 'select', options: ['Yes', 'No'] },
  capacity: { label: 'Capacity', type: 'number', placeholder: 'e.g., 50' },
  per_person_rate: { label: 'Rate per Person', type: 'number', placeholder: 'e.g., 25' },
  processing_time: { label: 'Processing Time (weeks)', type: 'number', placeholder: 'e.g., 2' },
  requirements: { label: 'Requirements', type: 'text', placeholder: 'Documents/requirements needed' },
  validity_period: { label: 'Validity Period', type: 'text', placeholder: 'e.g., 10 years' },
  license_type: { label: 'License Type', type: 'select', options: ['Standard', 'Commercial', 'International'] },
  visa_type: { label: 'Visa Type', type: 'select', options: ['Tourist', 'Business', 'Student', 'Work'] },
  permit_type: { label: 'Permit Type', type: 'text', placeholder: 'Type of permit' },
  document_type: { label: 'Document Type', type: 'select', options: ['Passport', 'Drivers License', 'Supplementary Birth Certificate'] },
  language_from: { label: 'Translate From', type: 'text', placeholder: 'e.g., French' },
  language_to: { label: 'Translate To', type: 'text', placeholder: 'e.g., English' },
  notary_type: { label: 'Notary Service Type', type: 'text', placeholder: 'e.g., Affidavit, Power of Attorney' },
  
  cuisine_type: { label: 'Cuisine Type', type: 'select', options: ['African', 'Asian', 'American', 'European', 'Mediterranean', 'Latin', 'Fusion', 'Other'] },
  meal_type: { label: 'Meal Type', type: 'select', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Beverage'] },
  spice_level: { label: 'Spice Level', type: 'select', options: ['Mild', 'Medium', 'Hot', 'Extra Hot'] },
  dietary_options: { label: 'Dietary Options', type: 'text', placeholder: 'e.g., Vegetarian, Vegan, Halal' },
  preparation_time: { label: 'Preparation Time (mins)', type: 'number', placeholder: 'e.g., 30' },
  item_type: { label: 'Item Type', type: 'text', placeholder: 'e.g., Bread, Cake, Pastry' },
  beverage_type: { label: 'Beverage Type', type: 'select', options: ['Hot', 'Cold', 'Alcoholic', 'Non-Alcoholic'] },
  temperature: { label: 'Serving Temperature', type: 'select', options: ['Hot', 'Cold', 'Room Temperature'] },
  
  storage_temp: { label: 'Storage Temperature', type: 'select', options: ['Refrigerated', 'Frozen', 'Room Temperature'] },
  meat_type: { label: 'Meat Type', type: 'select', options: ['Beef', 'Chicken', 'Pork', 'Lamb', 'Fish', 'Seafood'] },
  cut: { label: 'Cut/Type', type: 'text', placeholder: 'e.g., Fillet, Steak, Ground' },
  
  restaurant_name: { label: 'Restaurant Name', type: 'text', placeholder: 'Name of restaurant' },
  seating_capacity: { label: 'Seating Capacity', type: 'number', placeholder: 'e.g., 4' },
  time_slot: { label: 'Time Slot', type: 'text', placeholder: 'e.g., 7:00 PM - 9:00 PM' },
  location: { label: 'Location', type: 'text', placeholder: 'Address or area' },
  hotel_name: { label: 'Hotel Name', type: 'text', placeholder: 'Name of hotel' },
  room_type: { label: 'Room Type', type: 'select', options: ['Single', 'Double', 'Suite', 'Deluxe', 'Family'] },
  check_in: { label: 'Check-in Date', type: 'date' },
  check_out: { label: 'Check-out Date', type: 'date' },
  event_name: { label: 'Event Name', type: 'text', placeholder: 'Name of event' },
  event_type: { label: 'Event Type', type: 'select', options: ['Conference', 'Wedding', 'Birthday', 'Corporate', 'Concert', 'Workshop'] },
  venue: { label: 'Venue', type: 'text', placeholder: 'Event venue' },
  date_time: { label: 'Date & Time', type: 'text', placeholder: 'e.g., 2024-12-25 6:00 PM' },
  spa_service_type: { label: 'Spa Service', type: 'select', options: ['Massage', 'Facial', 'Body Treatment', 'Manicure/Pedicure', 'Sauna', 'Hot Tub', 'Aromatherapy'] },
  
  job_title: { label: 'Job Title', type: 'text', placeholder: 'e.g., Senior Software Engineer' },
  employment_type: { label: 'Employment Type', type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'] },
  experience_level: { label: 'Experience Level', type: 'select', options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'] },
  salary_range: { label: 'Salary Range', type: 'text', placeholder: 'e.g., $50,000 - $70,000' },
  skills_required: { label: 'Required Skills', type: 'text', placeholder: 'e.g., JavaScript, React, Node.js' },
  education_required: { label: 'Education Required', type: 'select', options: ['High School', 'Associate Degree', 'Bachelor Degree', 'Master Degree', 'PhD', 'Not Required'] },
  job_location: { label: 'Job Location', type: 'text', placeholder: 'City, State/Country' },
  contract_duration: { label: 'Contract Duration', type: 'text', placeholder: 'e.g., 6 months, 1 year' },
  internship_duration: { label: 'Internship Duration', type: 'text', placeholder: 'e.g., 3 months, Summer 2024' },
  stipend_amount: { label: 'Stipend Amount', type: 'text', placeholder: 'e.g., $500/month or Unpaid' },
  time_zone: { label: 'Time Zone', type: 'text', placeholder: 'e.g., EST, PST, UTC+2' },
  
  project_title: { label: 'Project Title', type: 'text', placeholder: 'Name of the project' },
  project_duration: { label: 'Project Duration', type: 'text', placeholder: 'e.g., 2 weeks, 1 month' },
  budget_range: { label: 'Budget Range', type: 'text', placeholder: 'e.g., $500 - $1000' },
  tech_stack: { label: 'Tech Stack', type: 'text', placeholder: 'e.g., React, Node.js, MongoDB' },
  experience_required: { label: 'Experience Required', type: 'select', options: ['Beginner', 'Intermediate', 'Expert', 'Any'] },
  portfolio_required: { label: 'Portfolio Required', type: 'select', options: ['Yes', 'No'] },
  design_tools: { label: 'Design Tools', type: 'text', placeholder: 'e.g., Figma, Adobe XD, Photoshop' },
  deliverables: { label: 'Deliverables', type: 'text', placeholder: 'e.g., Logo, Brand Kit, Website Mockup' },
  word_count: { label: 'Word Count', type: 'number', placeholder: 'e.g., 1000' },
  content_type: { label: 'Content Type', type: 'select', options: ['Blog Post', 'Article', 'Copy Writing', 'Technical Writing', 'Product Description'] },
  deadline: { label: 'Deadline', type: 'date' },
  samples_required: { label: 'Writing Samples Required', type: 'select', options: ['Yes', 'No'] },
  marketing_channels: { label: 'Marketing Channels', type: 'text', placeholder: 'e.g., SEO, Social Media, Email' },
  video_length: { label: 'Video Length', type: 'text', placeholder: 'e.g., 5 minutes, 30 seconds' },
  editing_software: { label: 'Editing Software', type: 'text', placeholder: 'e.g., Adobe Premiere, Final Cut Pro' },
  consulting_area: { label: 'Consulting Area', type: 'text', placeholder: 'e.g., Business Strategy, Marketing' },
};

// Document type and service type specific requirements configuration
const DOCUMENT_REQUIREMENTS: Record<string, string[]> = {
  'Passport': ['Birth Certificate', 'ID'],
  'Drivers License': ['Old Drivers License', 'ID', 'ID Witness', 'Contact info Witness'],
  'Birth Certificate': ['ID', 'Document'],
  'Marriage Certificate': ['ID', 'Document'],
  'Death Certificate': ['ID', 'Document'],
};

// Product form schema
const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  discountPrice: z.coerce.number().nonnegative().optional(),
  category: z.string().min(1, { message: "Please select a category" }),
  imageUrl: z.string().optional().refine((val) => {
    // Allow empty string or valid URL
    if (!val || val.trim() === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Please enter a valid image URL or leave empty"),
  inventory: z.coerce.number().int().nonnegative({ message: "Inventory must be a non-negative number" }),
  isNew: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  // New Shopify-style fields
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  offeringType: z.enum(['product', 'service', 'digital_product']).default('product'),
  vendor: z.string().optional(),
  collections: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  weight: z.coerce.number().min(0).max(10000000).optional().refine(
    (val) => val === undefined || Number((val * 1000).toFixed(0)) / 1000 === val,
    { message: "Weight must have at most 3 decimal places" }
  ),
  weightUnit: z.enum(['kg', 'lb', 'oz', 'g']).default('kg'),
  dimensions: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().default(true),
  continueSellingWhenOutOfStock: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
  videoUrl: z.string().optional(),
  vatIncluded: z.boolean().default(false),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  marketplace: z.enum(['c2c', 'b2c', 'b2b', 'raw', 'rqst', 'government-dr-congo']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  productCode: z.string().optional(),
  // Service-specific fields
  serviceDuration: z.string().optional(),
  serviceType: z.enum(['onetime', 'recurring', 'subscription', 'consultation']).optional(),
  serviceLocation: z.enum(['online', 'onsite', 'office', 'flexible']).optional(),
  // Vehicle-specific fields
  // Property-specific fields  
  propertyType: z.string().optional(),
  propertySize: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  propertyAge: z.string().optional(),
  // Dynamic category-specific fields
  categoryFields: z.record(z.string(), z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProduct() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { distanceUnit } = useDistanceUnit();
  const [isVendor, setIsVendor] = useState(false);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [customFields, setCustomFields] = useState<Array<{id: string, name: string, value: string}>>([]);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [hasShownAutoFillNotification, setHasShownAutoFillNotification] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isMarketplaceExpanded, setIsMarketplaceExpanded] = useState(true);
  const [isGovernmentExpanded, setIsGovernmentExpanded] = useState(true);
  const [isLifestyleExpanded, setIsLifestyleExpanded] = useState(true);
  const [isServicesExpanded, setIsServicesExpanded] = useState(true);
  const [selectedLifestyleType, setSelectedLifestyleType] = useState<'food' | 'groceries' | 'reservation' | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<'jobs' | 'freelance' | null>(null);

  // Parse URL parameters for prefill data and section tracking from Wouter location
  const getQueryParams = (loc: string) => {
    const searchIndex = loc.indexOf('?');
    return searchIndex >= 0 ? loc.substring(searchIndex) : '';
  };
  
  const urlParams = new URLSearchParams(getQueryParams(location));
  const prefillData = urlParams.get('prefill');
  const serviceType = urlParams.get('type'); // Check for government-service or other types
  const isGovernmentServiceFromUrl = serviceType === 'government-service';
  const marketplaceFromUrl = urlParams.get('marketplace'); // Get marketplace from URL
  const sectionFromUrl = urlParams.get('section') || (isGovernmentServiceFromUrl ? 'government' : 'marketplace');
  const [activeSection, setActiveSection] = useState(sectionFromUrl);
  
  // Sync activeSection with URL parameter whenever location changes
  useEffect(() => {
    const currentParams = new URLSearchParams(getQueryParams(location));
    const currentServiceType = currentParams.get('type');
    const isGovService = currentServiceType === 'government-service';
    const urlSection = currentParams.get('section') || (isGovService ? 'government' : 'marketplace');
    // Only update if the value has changed to avoid unnecessary renders
    if (urlSection !== activeSection) {
      setActiveSection(urlSection);
    }
  }, [location]);
  
  let parsedPrefillData = null;

  if (prefillData) {
    try {
      parsedPrefillData = JSON.parse(decodeURIComponent(prefillData));
    } catch (error) {
      console.error('Error parsing prefill data:', error);
    }
  }

  // State for media uploads
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [uploadedVideo, setUploadedVideo] = useState<{ file: File; preview: string } | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Comprehensive Add Product Page Text Collection for Translation
  const addProductTexts = [
    // Page Headers & Navigation
    "Add Product / Service",
    "Add Product",
    "Add Service", 
    "What are you offering?",
    "Product",
    "Service",
    "Digital Product",
    
    // Main Navigation Sections
    "Finance",
    "Government",
    "Lifestyle",
    "Services",
    "Marketplace",
    "Community",
    "Select Section",
    
    // Marketplace Sub-sections
    "Friend to Friend",
    "Request",
    "Online Store",
    "Whole Sale",
    "Upload products to the Marketplace section",
    "Upload financial products and services",
    "Upload government-related products and services",
    "Upload lifestyle products and services",
    "Upload professional services",
    "Upload community-related products",
    
    // Lifestyle Sub-sections
    "Order Food",
    "Groceries",
    "Reservation",
    "Dr Congo",
    
    // Services Sub-sections
    "Jobs",
    "Freelance",
    
    // Marketplace Auto-Selection Messages
    "Marketplace Auto-Selected",
    "Online Store (B2C) not available. Using first available marketplace.",
    "Request marketplace not available. Using first available marketplace.",
    "Using available marketplace for freelance services.",
    "Category Selected",
    
    // Authentication & Access
    "Please log in to add a product",
    "Login",
    "Become a Vendor",
    "You need to create a vendor account before you can add products.",
    "Create Vendor Account",
    "As a vendor, you'll be able to:",
    "List and sell your products on our marketplace",
    "Manage your inventory and orders", 
    "Receive payments directly to your account",
    "Build your brand and customer base",
    
    // Form Sections
    "Title",
    "Short sleeve t-shirt",
    "Product description...",
    "Description",
    
    // Marketplace Selection
    "Marketplace",
    "Select marketplace",
    "C2C (Consumer to Consumer)",
    "For individual sellers",
    "B2C (Business to Consumer)", 
    "For businesses selling to consumers",
    "B2B (Business to Business)",
    "For businesses selling to other businesses",
    "Choose which marketplace to list your product on",
    "Media",
    "Upload up to 12 images and 1 video for your product",
    "Product Images",
    "images",
    "Upload Images",
    "Image URLs",
    "Upload images",
    "PNG, JPG, GIF up to 5MB each",
    "Main",
    "Primary Image URL",
    "https://example.com/image.jpg",
    "Provide a URL to your main product image",
    "Additional Image URLs",
    "Image",
    "Add Image URL",
    "Product Video",
    "video",
    "Upload Video",
    "Video URL",
    "Upload video",
    "MP4, MOV, AVI up to 50MB",
    "https://example.com/video.mp4",
    "Provide a URL to your product video",
    "Product Image",
    "Pricing",
    "Price",
    "Compare-at price",
    
    // Inventory Section
    "Inventory",
    "Track quantity",
    "Continue selling when out of stock",
    "This won't affect Shopify POS. Staff will see a warning, but can complete sales when available inventory reaches zero and below.",
    "Quantity",
    
    // Shipping Section
    "Shipping",
    "This is a physical product",
    "Weight",
    "Unit",
    "Dimensions",
    "Dimensions (L × W × H)",
    "10 × 5 × 2 cm",
    "Length x Width x Height",
    "Shipping Carrier",
    "Select shipping carrier",
    "Customs information",
    "Add customs information",
    "Country/Region of origin",
    "HS code",
    "Search by product keyword or HS code",
    
    // SEO Section
    "Search engine listing preview",
    "Add a title and description to see how this product might appear in a search engine listing",
    "Page title",
    "Meta description",
    
    // Organization Section
    "Organization",
    "Product type",
    "Vendor",
    "Collections",
    "Tags",
    
    // Product Status
    "Product status",
    "Active",
    "Draft",
    "Archived",
    
    // Product Availability  
    "Product availability",
    "Available on all channels",
    "Unavailable on all channels",
    "Available on selected channels",
    
    // Publishing
    "Publishing",
    "Online Store",
    "Point of Sale",
    "Shop",
    "Facebook & Instagram",
    "Google",
    "Available",
    "Unavailable",
    "Set availability date",
    
    // Service-specific fields
    "Service Duration",
    "Service Type",
    "Service Location",
    "In-person",
    "Online", 
    "Both",
    "Consultation",
    "Installation",
    "Repair",
    "Maintenance", 
    "Training",
    "Other",
    
    // Product/Service/Vehicle/Real Estate/XL-XXL Badges
    "Product badges",
    "Service badges",
    "Vehicle badges",
    "Property badges",
    "XL/XXL Product badges",
    
    // Vehicle Details
    "Vehicle Details",
    "Make",
    "Model",
    "Year", 
    "Mileage",
    "e.g., Toyota, BMW",
    "e.g., Camry, X5",
    "e.g., 2020",
    "e.g., 50,000 km",
    
    // Real Estate Details
    "Property Details",
    "Property Type",
    "Size (sq ft/m²)",
    "Bedrooms",
    "Bathrooms", 
    "Age (years)",
    "House",
    "Apartment",
    "Condo",
    "Land",
    "Commercial",
    "e.g., 1200 sq ft",
    "e.g., 3",
    "e.g., 2",
    "e.g., 5",
    
    // Action Buttons
    "Publish",
    "Save as draft",
    "Preview",
    "Delete product",
    "Duplicate",
    "View product",
    
    // Status Messages
    "Product Added",
    "Your product has been added successfully.",
    "Product created successfully with code:",
    "Error",
    "Failed to add product:",
    "Vendor Account Created", 
    "Your vendor account has been created successfully. You can now add products.",
    "Failed to create vendor account:",
    
    // Form Validation
    "Product name must be at least 3 characters",
    "Description must be at least 10 characters", 
    "Price must be positive",
    "Please select a category",
    
    // Common UI Elements
    "Loading...",
    "Save",
    "Cancel",
    "Edit", 
    "Delete",
    "Back",
    "Next",
    "Submit",
    "Reset",
    "Clear",
    "Apply",
    "Other",
    
    // Weight Units
    "kg",
    "lb", 
    "oz",
    "g",
    
    // Dimension Units and Placeholders
    "cm",
    "inches",
    "10 × 5 × 2",
    "4 × 2 × 1",
    
    // Shipping Price Types
    "Shipping Price Type",
    "Fixed Shipping Price",
    "Variable Shipping Price",
    "1.5% Dedw3n Shipping Fee will be applied",
    
    // Regional Shipping
    "Regional Shipping",
    "Select regions to ship to and set custom prices",
    "Based on your profile location",
    "Enable shipping to this region",
    
    // Vendor Field
    "Auto-filled from vendor account",
    "Automatically populated based on your vendor account and marketplace selection",
    
    // Upload Button
    "Upload Product",
    "Uploading...",
    "Product Saved & Published",
    "Product saved and published successfully with code:",
    "Your product has been saved and published to the marketplace successfully.",
    "Failed to save and publish product:"
  ];

  // Use Master Translation System for optimal performance and persistence
  const { translations, isLoading: isTranslating } = useMasterBatchTranslation(addProductTexts);

  // Helper function to get translated text
  const t = (text: string): string => {
    if (!translations || Array.isArray(translations)) return text;
    return (translations as Record<string, string>)[text] || text;
  };

  // Helper function to extract all images from prefill data
  const getAutoFilledImages = (): string[] => {
    if (!parsedPrefillData) return [];
    
    const images: string[] = [];
    
    // Add primary image URL
    if (parsedPrefillData.imageUrl && parsedPrefillData.imageUrl !== '/placeholder-image.jpg') {
      images.push(parsedPrefillData.imageUrl);
    }
    
    // Add additional images if they exist in prefill data
    if (parsedPrefillData.images && Array.isArray(parsedPrefillData.images)) {
      parsedPrefillData.images.forEach((img: string) => {
        if (img && img !== '/placeholder-image.jpg' && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Add gallery images if they exist
    if (parsedPrefillData.gallery && Array.isArray(parsedPrefillData.gallery)) {
      parsedPrefillData.gallery.forEach((img: string) => {
        if (img && img !== '/placeholder-image.jpg' && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    // Add imageUrls array if it exists
    if (parsedPrefillData.imageUrls && Array.isArray(parsedPrefillData.imageUrls)) {
      parsedPrefillData.imageUrls.forEach((img: string) => {
        if (img && img !== '/placeholder-image.jpg' && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    
    return images.slice(0, 12); // Limit to maximum 12 images
  };

  // Helper function to get count of auto-filled images
  const getAutoFilledImageCount = (): number => {
    return getAutoFilledImages().length;
  };

  // Form initialization with prefill support
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: parsedPrefillData?.name || '',
      description: parsedPrefillData?.description || '',
      price: parsedPrefillData?.price || 0,
      discountPrice: undefined,
      category: parsedPrefillData?.category || '',
      imageUrl: parsedPrefillData?.imageUrl || '',
      inventory: parsedPrefillData?.stock || 1,
      isNew: false,
      isOnSale: false,
      // New Shopify-style field defaults
      status: 'active',
      offeringType: parsedPrefillData?.type || 'product',
      vendor: '',
      collections: [],
      tags: [],
      weight: parsedPrefillData?.weight || undefined,
      weightUnit: 'kg',
      dimensions: '',
      sku: '',
      barcode: '',
      trackQuantity: true,
      continueSellingWhenOutOfStock: false,
      requiresShipping: true,
      marketplace: marketplaceFromUrl === 'government-dr-congo' ? 'government-dr-congo' : 'c2c',
      seoTitle: '',
      seoDescription: '',
      serviceDuration: '',
      serviceType: undefined,
      serviceLocation: undefined,
      vatIncluded: true,
      vatRate: 20,
      // Vehicle fields
      // Property fields
      propertyType: '',
      propertySize: '',
      bedrooms: '',
      bathrooms: '',
      propertyAge: '',
      // Category-specific fields
      categoryFields: {
        modifications_included: 'Yes',
      },
    },
  });

  // Update form marketplace and category fields when URL parameter changes
  useEffect(() => {
    const params = new URLSearchParams(getQueryParams(location));
    const urlMarketplace = params.get('marketplace');
    const urlType = params.get('type');
    
    if (urlMarketplace === 'government-dr-congo' && urlType === 'government-service') {
      form.setValue('marketplace', 'government-dr-congo');
      // Set default category to Document if not already set
      const currentCategory = form.getValues('category');
      if (!currentCategory || !currentCategory.startsWith('gov-')) {
        form.setValue('category', 'gov-document');
      }
      // Auto-expand government section and set active
      setIsGovernmentExpanded(true);
      setActiveSection('government');
    }
  }, [location, form]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      return await apiRequest('/api/categories');
    },
  });

  // Get user's vendor accounts to determine marketplace availability
  const { data: vendorAccountsData } = useQuery<{vendorAccounts: any[]}>({
    queryKey: ['/api/vendors/user/accounts'],
    enabled: !!user,
  });

  // Compute isGovernmentService based on URL parameter or marketplace selection
  const currentMarketplace = form.watch('marketplace');
  const isGovernmentService = isGovernmentServiceFromUrl || currentMarketplace === 'government-dr-congo';

  // Auto-expand government section when isGovernmentService becomes true
  useEffect(() => {
    if (isGovernmentService) {
      setIsGovernmentExpanded(true);
      setActiveSection('government');
    }
  }, [isGovernmentService]);

  // Smart auto-selection based on navigation source (from URL section parameter)
  useEffect(() => {
    const params = new URLSearchParams(getQueryParams(location));
    const urlSection = params.get('section');
    
    // Only run auto-selection when section is provided in URL
    // If no section param, just open the page without auto-selecting anything
    if (!urlSection) return;
    
    // Lifestyle section - auto-select Groceries (first option)
    if (urlSection === 'lifestyle' && !selectedLifestyleType) {
      setIsLifestyleExpanded(true);
      setActiveSection('lifestyle');
      setSelectedLifestyleType('groceries');
      form.setValue('offeringType', 'service');
      form.setValue('category', '');
      // Set marketplace - prefer b2c, then rqst
      const marketplace = availableMarketplaces.find(m => m.value === 'b2c')
        ? 'b2c'
        : availableMarketplaces.find(m => m.value === 'rqst')
        ? 'rqst'
        : availableMarketplaces[0]?.value || 'rqst';
      form.setValue('marketplace', marketplace as any);
    }
    
    // Services section - auto-select Jobs (first option)
    if (urlSection === 'services' && !selectedServiceType) {
      setIsServicesExpanded(true);
      setActiveSection('services');
      setSelectedServiceType('jobs');
      form.setValue('offeringType', 'service');
      form.setValue('category', '');
      // Set marketplace - prefer rqst for jobs
      const marketplace = availableMarketplaces.find(m => m.value === 'rqst')
        ? 'rqst'
        : availableMarketplaces[0]?.value || 'rqst';
      form.setValue('marketplace', marketplace as any);
    }
    
    // Government section - already handled by existing useEffect
    if (urlSection === 'government') {
      setIsGovernmentExpanded(true);
      setActiveSection('government');
    }
    
    // Marketplace section (Friend to Friend, etc.)
    if (urlSection === 'marketplace' && !isGovernmentService) {
      setIsMarketplaceExpanded(true);
      setActiveSection('marketplace');
      // Default to c2c for marketplace section
      if (availableMarketplaces.find(m => m.value === 'c2c')) {
        form.setValue('marketplace', 'c2c');
      }
    }
  }, [location]);

  // Determine available marketplaces based on vendor type
  const getAvailableMarketplaces = () => {
    // Safety check for null/undefined data
    if (!vendorAccountsData || !vendorAccountsData.vendorAccounts || !Array.isArray(vendorAccountsData.vendorAccounts)) {
      const baseMarketplaces = [
        { value: 'c2c', label: 'Friend to Friend', description: 'For individual sellers' },
        { value: 'rqst', label: 'Request', description: 'Post product requests' }
      ];
      
      // Add government services if applicable
      if (isGovernmentService) {
        baseMarketplaces.push({ value: 'government-dr-congo', label: 'Dr Congo', description: 'Government services for Dr Congo' });
      }
      
      return baseMarketplaces;
    }
    
    const vendorAccounts = vendorAccountsData.vendorAccounts;
    const hasPrivateVendor = vendorAccounts.some((account: any) => account.vendorType === 'private');
    const hasBusinessVendor = vendorAccounts.some((account: any) => account.vendorType === 'business');
    
    const marketplaces = [];
    
    if (hasPrivateVendor) {
      marketplaces.push({ value: 'c2c', label: 'Friend to Friend', description: 'For individual sellers' });
    }
    
    // Request is available to all vendors
    marketplaces.push({ value: 'rqst', label: 'Request', description: 'Post product requests' });
    
    if (hasBusinessVendor) {
      marketplaces.push(
        { value: 'b2c', label: 'Online Store', description: 'For businesses selling to consumers' },
        { value: 'b2b', label: 'Whole Sale', description: 'For businesses selling to other businesses' }
      );
    }
    
    // Add government services if applicable
    if (isGovernmentService) {
      marketplaces.push({ value: 'government-dr-congo', label: 'Dr Congo', description: 'Government services for Dr Congo' });
    }
    
    return marketplaces;
  };

  const availableMarketplaces = getAvailableMarketplaces();
  
  // Get marketplace display label based on active section
  const getMarketplaceDisplayLabel = () => {
    // For Lifestyle section
    if (activeSection === 'lifestyle' && selectedLifestyleType) {
      if (selectedLifestyleType === 'food') {
        return { label: t("Order Food"), description: t("Food ordering and delivery marketplace") };
      } else if (selectedLifestyleType === 'groceries') {
        return { label: t("Groceries"), description: t("Grocery shopping marketplace") };
      } else if (selectedLifestyleType === 'reservation') {
        return { label: t("Reservation"), description: t("Reservation and booking marketplace") };
      }
    }
    
    // For Services section
    if (activeSection === 'services' && selectedServiceType) {
      if (selectedServiceType === 'jobs') {
        return { label: t("Jobs"), description: t("Job posting marketplace") };
      } else if (selectedServiceType === 'freelance') {
        return { label: t("Freelance"), description: t("Freelance services marketplace") };
      }
    }
    
    // For Government section
    if (isGovernmentService || activeSection === 'government') {
      return { label: t("Dr Congo"), description: t("Government services for Dr Congo") };
    }
    
    // Default: show the actual marketplace type
    const currentMarketplace = form.watch('marketplace');
    const marketplace = availableMarketplaces.find(m => m.value === currentMarketplace);
    return {
      label: marketplace?.label || t("Select from sidebar"),
      description: marketplace?.description || t("Use the sidebar to select a marketplace")
    };
  };
  
  // Set default marketplace when available marketplaces change
  useEffect(() => {
    if (availableMarketplaces.length > 0 && !form.getValues('marketplace')) {
      form.setValue('marketplace', availableMarketplaces[0].value as 'c2c' | 'b2c' | 'b2b' | 'raw' | 'rqst');
    }
  }, [availableMarketplaces, form]);


  // Auto-fill vendor name based on marketplace selection
  useEffect(() => {
    if (vendorAccountsData?.vendorAccounts && vendorAccountsData.vendorAccounts.length > 0) {
      const selectedMarketplace = form.getValues('marketplace');
      const vendorAccounts = vendorAccountsData.vendorAccounts;
      
      let targetVendor;
      if (selectedMarketplace === 'c2c') {
        // C2C requires private vendor account
        targetVendor = vendorAccounts.find((account: any) => account.vendorType === 'private');
      } else if (selectedMarketplace === 'b2c' || selectedMarketplace === 'b2b') {
        // B2C and B2B require business vendor account
        targetVendor = vendorAccounts.find((account: any) => account.vendorType === 'business');
      }
      
      // Fallback to first available vendor account
      if (!targetVendor) {
        targetVendor = vendorAccounts[0];
      }
      
      const vendorName = targetVendor?.storeName || targetVendor?.businessName || '';
      if (vendorName) {
        form.setValue('vendor', vendorName);
      }
    }
  }, [vendorAccountsData, form]);

  // Check if user is a vendor
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) {
        return;
      }

      try {
        // Check if user is already a vendor
        const vendors = await apiRequest('/api/vendors');
        const userVendor = vendors.find((v: any) => v.userId === user.id);
        
        if (userVendor) {
          setIsVendor(true);
          setVendorId(userVendor.id);
        } else {
          // User is not a vendor
          setIsVendor(false);
        }
      } catch (error) {
        console.error('Error checking vendor status:', error);
      }
    };

    checkVendorStatus();
  }, [user]);

  // Show success message when form is pre-filled from RQST (only once)
  useEffect(() => {
    if (parsedPrefillData && parsedPrefillData.name && !hasShownAutoFillNotification) {
      toast({
        title: "Product Data Auto-Filled",
        description: `Product "${parsedPrefillData.name}" data has been automatically filled with ${getAutoFilledImageCount()} image(s). Review and click Publish to add to your store.`,
        duration: 5000,
      });
      
      setHasShownAutoFillNotification(true);
      
      // Auto-populate ALL image URLs from original request
      const autoFilledImages = getAutoFilledImages();
      if (autoFilledImages.length > 0) {
        setImageUrls(autoFilledImages);
        
        // Update form with primary image URL
        form.setValue('imageUrl', autoFilledImages[0]);
      }
      
      // Auto-populate video URL if provided
      if (parsedPrefillData.videoUrl && parsedPrefillData.videoUrl !== '/placeholder-video.mp4') {
        form.setValue('videoUrl', parsedPrefillData.videoUrl);
      }
    }
  }, [parsedPrefillData, hasShownAutoFillNotification]);

  // Clear category fields when offering type or category changes to prevent stale data
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'offeringType' || name === 'category') {
        form.setValue('categoryFields', {});
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async (data: { storeName: string, description: string }) => {
      const response = await apiRequest('POST', '/api/vendors', data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsVendor(true);
      setVendorId(data.id);
      toast({
        title: t('Vendor Account Created'),
        description: t('Your vendor account has been created successfully. You can now add products.'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('Error'),
        description: `${t('Failed to create vendor account:')} ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      console.log('🚀 Starting product creation with images:', { 
        uploadedImagesCount: uploadedImages.length,
        imageUrl: data.imageUrl 
      });
      
      let finalImageUrl = data.imageUrl;
      
      // If there are uploaded images, upload the first one to server
      if (uploadedImages.length > 0 && uploadedImages[0].file) {
        console.log('📸 Uploading image to server...');
        try {
          // Convert File to base64 for upload
          const file = uploadedImages[0].file;
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const imageData = await base64Promise;
          
          // Upload to server using existing image upload API
          const uploadResponse = await fetch('/api/image/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageData,
              imageType: 'product'
            }),
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Upload failed: ${errorData.message || uploadResponse.statusText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          console.log('✅ Image uploaded successfully:', uploadResult);
          
          // Use the uploaded image URL
          finalImageUrl = uploadResult.imageUrl;
        } catch (uploadError: any) {
          console.error('❌ Image upload failed:', uploadError);
          // Show error to user and abort product creation
          throw new Error(`Image upload failed: ${uploadError.message}. Please try again or use an image URL instead.`);
        }
      }
      
      // Transform frontend field names to backend expected field names
      const backendData = {
        ...data,
        name: data.name, // Use the correct 'name' field from schema
        // Use uploaded image URL or fallback
        imageUrl: finalImageUrl || '/attached_assets/D3%20black%20logo.png',
        // All fields properly mapped from schema
      };
      
      console.log('💾 Sending product data to backend:', backendData);
      const response = await apiRequest('POST', '/api/vendors/products', backendData);
      return response.json();
    },
    onSuccess: (data) => {
      // Update form with the generated product code if available
      if (data.productCode) {
        form.setValue('productCode', data.productCode);
      }
      
      // Invalidate products query
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/products'] });
      
      // Store success data and show modal
      setSuccessData(data);
      setShowSuccessDialog(true);
    },
    onError: (error: any) => {
      // Show error popup with detailed information
      const errorMessage = error.message || 'Unknown error occurred';
      
      toast({
        title: t('❌ Upload Failed'),
        description: `${t('Failed to publish product:')} ${errorMessage}`,
        variant: 'destructive',
        duration: 8000,
      });
      
      // Show detailed error alert dialog
      alert(`❌ UPLOAD FAILED!\n\nError Details: ${errorMessage}\n\nPlease check:\n• All required fields are filled\n• Valid image URL or upload\n• Internet connection\n• Try again or contact support`);
      
      console.error('Product upload error:', error);
    },
  });

  // Add custom field handler
  const addCustomField = () => {
    const newField = {
      id: `custom_${Date.now()}`,
      name: '',
      value: ''
    };
    setCustomFields(prev => [...prev, newField]);
  };

  // Remove custom field handler
  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
  };

  // Update custom field handler
  const updateCustomField = (id: string, field: 'name' | 'value', newValue: string) => {
    setCustomFields(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: newValue } : f
    ));
  };

  // Media upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: Array<{ file: File; preview: string }> = [];
    const remainingSlots = 12 - uploadedImages.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB limit
        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview });
      }
    }

    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
    }

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const imageToRemove = prev[index];
      URL.revokeObjectURL(imageToRemove.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/') && file.size <= 50 * 1024 * 1024) { // 50MB limit
      if (uploadedVideo) {
        URL.revokeObjectURL(uploadedVideo.preview);
      }
      const preview = URL.createObjectURL(file);
      setUploadedVideo({ file, preview });
    }

    // Reset input
    e.target.value = '';
  };

  const removeVideo = () => {
    if (uploadedVideo) {
      URL.revokeObjectURL(uploadedVideo.preview);
      setUploadedVideo(null);
    }
  };

  // Image URL handlers
  const addImageUrl = () => {
    setImageUrls(prev => [...prev, '']);
  };

  const updateImageUrl = (index: number, url: string) => {
    setImageUrls(prev => prev.map((u, i) => i === index ? url : u));
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Cleanup effect for blob URLs
  useEffect(() => {
    return () => {
      // Cleanup image previews
      uploadedImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
      // Cleanup video preview
      if (uploadedVideo) {
        URL.revokeObjectURL(uploadedVideo.preview);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      uploadedImages.forEach(image => {
        URL.revokeObjectURL(image.preview);
      });
      if (uploadedVideo) {
        URL.revokeObjectURL(uploadedVideo.preview);
      }
    };
  }, [uploadedImages, uploadedVideo]);

  // Generate URL-friendly slug from product name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // On form submit
  const onSubmit = (values: ProductFormValues) => {
    console.log('🚀 Form submission started!', values);
    console.log('📸 Images to process:', {
      uploadedImagesCount: uploadedImages.length,
      imageUrl: values.imageUrl,
      firstImageFile: uploadedImages[0]?.file?.name || 'none'
    });
    console.log('🔍 Vendor status check:', { 
      isVendor, 
      userIsVendor: user?.isVendor, 
      vendorAccountsData: vendorAccountsData,
      hasVendorAccounts: vendorAccountsData?.vendorAccounts?.length > 0 
    });
    
    // Check if user has vendor accounts from the API response
    if (!vendorAccountsData?.vendorAccounts?.length) {
      console.log('❌ No vendor accounts found, showing error');
      toast({
        title: t('Error'),
        description: t('You need to create a vendor account first.'),
        variant: 'destructive',
      });
      return;
    }
    
    // Generate slug from product name
    const slug = generateSlug(values.name);
    
    // Add custom fields and slug to submission data
    const submitData = {
      ...values,
      slug,
      customFields: customFields.filter(field => field.name && field.value)
    };
    
    // If user has isVendor but no vendorId, we'll handle this on the server side
    // The server will create a temporary vendor profile if needed
    createProductMutation.mutate(submitData);
  };

  // Handle vendor creation
  const handleCreateVendor = () => {
    setShowVendorDialog(true);
  };

  const handleVendorSubmit = (data: { storeName: string; description: string }) => {
    createVendorMutation.mutate(data);
    setShowVendorDialog(false);
  };

  // Handle success dialog confirmation
  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    if (successData?.id) {
      setLocation(`/product/${successData.id}`);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("Add Product")}</CardTitle>
            <CardDescription>{t("Please log in to add a product")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/auth')}>{t("Login")}</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Display vendor registration prompt if user is not a vendor and doesn't have isVendor flag
  if (!isVendor && !(user && user.isVendor === true) && !createVendorMutation.isPending) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("Become a Vendor")}</CardTitle>
            <CardDescription>
              {t("You need to create a vendor account before you can add products.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {t("As a vendor, you'll be able to:")}
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>{t("List and sell your products on our marketplace")}</li>
              <li>{t("Manage your inventory and orders")}</li>
              <li>{t("Receive payments directly to your account")}</li>
              <li>{t("Build your brand and customer base")}</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateVendor}>{t("Create Vendor Account")}</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loader while vendor creation is in progress
  if (createVendorMutation.isPending) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generate href for section links preserving current query params
  const getSectionHref = (sectionId: string) => {
    const currentParams = new URLSearchParams(getQueryParams(location));
    // Ensure we only have one section parameter by deleting first then setting
    currentParams.delete('section');
    currentParams.set('section', sectionId);
    const basePath = location.split('?')[0];
    return `${basePath}?${currentParams.toString()}`;
  };

  // Map sidebar item IDs to marketplace values
  const marketplaceIdMap: Record<string, 'c2c' | 'b2c' | 'b2b' | 'rqst'> = {
    'friend-to-friend': 'c2c',
    'request': 'rqst',
    'online-store': 'b2c',
    'wholesale': 'b2b',
  };

  // Filter marketplace sub-items based on vendor type
  const getFilteredMarketplaceSubItems = () => {
    const vendorAccounts = vendorAccountsData?.vendorAccounts;
    
    if (!vendorAccounts || !Array.isArray(vendorAccounts)) {
      return [];
    }
    
    const hasPrivateVendor = vendorAccounts.some((account: any) => account.vendorType === 'private');
    const hasBusinessVendor = vendorAccounts.some((account: any) => account.vendorType === 'business');
    
    const subItems = [];
    
    // Friend to Friend - Only for private vendors
    if (hasPrivateVendor) {
      subItems.push({
        id: 'friend-to-friend',
        label: t("Friend to Friend"),
        marketplaceValue: 'c2c' as const,
      });
    }
    
    // Request - Available to all vendors
    subItems.push({
      id: 'request',
      label: t("Request"),
      marketplaceValue: 'rqst' as const,
    });
    
    // Online Store and Whole Sale - Only for business vendors
    if (hasBusinessVendor) {
      subItems.push(
        {
          id: 'online-store',
          label: t("Online Store"),
          marketplaceValue: 'b2c' as const,
        },
        {
          id: 'wholesale',
          label: t("Whole Sale"),
          marketplaceValue: 'b2b' as const,
        }
      );
    }
    
    return subItems;
  };

  // Helper function to get appropriate marketplace for subcategory
  const getMarketplaceForSubcategory = (subcategoryType: string): 'c2c' | 'b2c' | 'b2b' | 'rqst' => {
    const vendorAccounts = vendorAccountsData?.vendorAccounts || [];
    const hasPrivateVendor = vendorAccounts.some((account: any) => account.vendorType === 'private');
    const hasBusinessVendor = vendorAccounts.some((account: any) => account.vendorType === 'business');
    
    // Build available marketplaces based on vendor type (independent of form state)
    const availableMarketplaces: Array<'c2c' | 'b2c' | 'b2b' | 'rqst'> = [];
    
    if (hasPrivateVendor) {
      availableMarketplaces.push('c2c');
    }
    
    // Request is always available to all vendors
    availableMarketplaces.push('rqst');
    
    if (hasBusinessVendor) {
      availableMarketplaces.push('b2c', 'b2b');
    }
    
    // Lifestyle subcategories: prefer b2c, fallback to rqst, then any available
    if (['order-food', 'groceries', 'reservation'].includes(subcategoryType)) {
      if (availableMarketplaces.includes('b2c')) return 'b2c';
      if (availableMarketplaces.includes('rqst')) return 'rqst';
      return availableMarketplaces[0] || 'rqst'; // Default to rqst if nothing available
    }
    
    // Services → Jobs: prefer rqst, then any available
    if (subcategoryType === 'jobs') {
      if (availableMarketplaces.includes('rqst')) return 'rqst';
      return availableMarketplaces[0] || 'rqst'; // Default to rqst
    }
    
    // Services → Freelance: prefer b2b, then rqst (NEVER c2c to keep Freelance independent from Friend to Friend)
    if (subcategoryType === 'freelance') {
      if (hasBusinessVendor && availableMarketplaces.includes('b2b')) return 'b2b';
      if (availableMarketplaces.includes('rqst')) return 'rqst';
      return availableMarketplaces[0] || 'rqst'; // Default to rqst
    }
    
    // Final fallback
    return availableMarketplaces[0] || 'rqst';
  };

  // Government sub-items
  const governmentSubItems = [
    {
      id: 'dr-congo',
      label: t("Dr Congo"),
      marketplaceValue: 'government-dr-congo' as const,
    }
  ];

  // Lifestyle sub-items - load form on current page
  const lifestyleSubItems = [
    {
      id: 'order-food',
      label: t("Order Food"),
      onClick: () => {
        setSelectedLifestyleType('food');
        setActiveSection('lifestyle');
        form.setValue('offeringType', 'product');
        form.setValue('category', ''); // Reset category to force user to select from food categories
        // Set marketplace - prefer b2c, fallback to rqst
        const marketplace = availableMarketplaces.find(m => m.value === 'b2c') 
          ? 'b2c' 
          : (availableMarketplaces.find(m => m.value === 'rqst') ? 'rqst' : availableMarketplaces[0]?.value || 'rqst');
        form.setValue('marketplace', marketplace as any);
      },
    },
    {
      id: 'groceries',
      label: t("Groceries"),
      onClick: () => {
        setSelectedLifestyleType('groceries');
        setActiveSection('lifestyle');
        form.setValue('offeringType', 'product');
        form.setValue('category', ''); // Reset category to force user to select from grocery categories
        // Set marketplace - prefer b2c, fallback to rqst
        const marketplace = availableMarketplaces.find(m => m.value === 'b2c') 
          ? 'b2c' 
          : (availableMarketplaces.find(m => m.value === 'rqst') ? 'rqst' : availableMarketplaces[0]?.value || 'rqst');
        form.setValue('marketplace', marketplace as any);
      },
    },
    {
      id: 'reservation',
      label: t("Reservation"),
      onClick: () => {
        setSelectedLifestyleType('reservation');
        setActiveSection('lifestyle');
        form.setValue('offeringType', 'service');
        form.setValue('category', ''); // Reset category to force user to select from reservation categories
        // Set marketplace - prefer b2c, fallback to rqst
        const marketplace = availableMarketplaces.find(m => m.value === 'b2c') 
          ? 'b2c' 
          : (availableMarketplaces.find(m => m.value === 'rqst') ? 'rqst' : availableMarketplaces[0]?.value || 'rqst');
        form.setValue('marketplace', marketplace as any);
      },
    }
  ];

  // Services sub-items - load form on current page
  const servicesSubItems = [
    {
      id: 'jobs',
      label: t("Jobs"),
      onClick: () => {
        setSelectedServiceType('jobs');
        setActiveSection('services');
        form.setValue('offeringType', 'service');
        form.setValue('category', ''); // Reset category to force user to select from job categories
        // Set marketplace - prefer rqst for jobs
        const marketplace = availableMarketplaces.find(m => m.value === 'rqst') 
          ? 'rqst' 
          : availableMarketplaces[0]?.value || 'rqst';
        form.setValue('marketplace', marketplace as any);
      },
    },
    {
      id: 'freelance',
      label: t("Freelance"),
      onClick: () => {
        setSelectedServiceType('freelance');
        setActiveSection('services');
        form.setValue('offeringType', 'service');
        form.setValue('category', ''); // Reset category to force user to select from freelance categories
        // Set marketplace - prefer b2b, then rqst (NEVER c2c to keep Freelance independent from Friend to Friend)
        const marketplace = availableMarketplaces.find(m => m.value === 'b2b')
          ? 'b2b'
          : availableMarketplaces.find(m => m.value === 'rqst')
          ? 'rqst'
          : availableMarketplaces[0]?.value || 'rqst';
        form.setValue('marketplace', marketplace as any);
      },
    }
  ];

  // Navigation sections - memoized to prevent unnecessary re-renders
  const navigationSections = useMemo(() => {
    const marketplaceSubItems = getFilteredMarketplaceSubItems();
    
    // Check if user has access to Finance section (Admin or Serruti only)
    const hasFinanceAccess = user?.role === 'admin' || user?.username === 'Serruti';
    
    const allSections = [
      {
        id: 'finance',
        label: t("Finance"),
        href: getSectionHref('finance'),
        isActive: activeSection === 'finance',
      },
      {
        id: 'government',
        label: t("Government"),
        href: getSectionHref('government'),
        isActive: activeSection === 'government' || isGovernmentService,
        hasSubItems: true,
        subItems: governmentSubItems,
      },
      {
        id: 'lifestyle',
        label: t("Lifestyle"),
        href: getSectionHref('lifestyle'),
        isActive: activeSection === 'lifestyle',
        hasSubItems: true,
        subItems: lifestyleSubItems,
      },
      {
        id: 'services',
        label: t("Services"),
        href: getSectionHref('services'),
        isActive: activeSection === 'services',
        hasSubItems: true,
        subItems: servicesSubItems,
      },
      {
        id: 'marketplace',
        label: t("Marketplace"),
        href: getSectionHref('marketplace'),
        isActive: activeSection === 'marketplace',
        hasSubItems: marketplaceSubItems.length > 0,
        subItems: marketplaceSubItems,
      },
    ];
    
    // Filter out Finance section for non-authorized users
    return allSections.filter(section => section.id !== 'finance' || hasFinanceAccess);
  }, [activeSection, location, t, vendorAccountsData, user]);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Grid Layout with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Left Sidebar - Section Navigation */}
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <Card className="border-2 h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{t("Add Product/Service")}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1 overflow-y-auto">
              <nav className="space-y-2" role="navigation" aria-label="Section navigation">
                {navigationSections.map((section) => (
                  <div key={section.id}>
                    {section.hasSubItems ? (
                      <>
                        <button
                          onClick={() => {
                            if (section.id === 'marketplace') {
                              setIsMarketplaceExpanded(!isMarketplaceExpanded);
                            } else if (section.id === 'government') {
                              setIsGovernmentExpanded(!isGovernmentExpanded);
                            } else if (section.id === 'lifestyle') {
                              setIsLifestyleExpanded(!isLifestyleExpanded);
                            } else if (section.id === 'services') {
                              setIsServicesExpanded(!isServicesExpanded);
                            }
                          }}
                          data-testid={`section-${section.id}`}
                          className={cn(
                            "w-full flex items-center justify-between px-5 py-4 rounded-lg text-base font-semibold tracking-wide transition-all text-left",
                            section.isActive
                              ? "bg-black text-white shadow-md"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          <span>{section.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 transition-transform",
                              (section.id === 'marketplace' ? isMarketplaceExpanded : 
                               section.id === 'government' ? isGovernmentExpanded : 
                               section.id === 'lifestyle' ? isLifestyleExpanded : 
                               section.id === 'services' ? isServicesExpanded : false) ? "rotate-180" : ""
                            )}
                          />
                        </button>
                        {((section.id === 'marketplace' && isMarketplaceExpanded) || (section.id === 'government' && isGovernmentExpanded) || (section.id === 'lifestyle' && isLifestyleExpanded) || (section.id === 'services' && isServicesExpanded)) && section.subItems && (
                          <div className="ml-4 mt-1 space-y-1">
                            {section.subItems.map((subItem: any) => {
                              let isSelected = false;
                              
                              // Check selection based on section type
                              if (subItem.marketplaceValue) {
                                isSelected = form.watch('marketplace') === subItem.marketplaceValue;
                              } else if (section.id === 'lifestyle') {
                                isSelected = (subItem.id === 'order-food' && selectedLifestyleType === 'food') ||
                                            (subItem.id === 'groceries' && selectedLifestyleType === 'groceries') ||
                                            (subItem.id === 'reservation' && selectedLifestyleType === 'reservation');
                              } else if (section.id === 'services') {
                                isSelected = (subItem.id === 'jobs' && selectedServiceType === 'jobs') ||
                                            (subItem.id === 'freelance' && selectedServiceType === 'freelance');
                              }
                              
                              // Render as Link if href is present, otherwise as button
                              if (subItem.href) {
                                return (
                                  <Link
                                    key={subItem.id}
                                    href={subItem.href}
                                    data-testid={`${section.id}-${subItem.id}`}
                                    className={cn(
                                      "w-full block px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all text-left",
                                      isSelected
                                        ? "bg-black text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                  >
                                    {subItem.label}
                                  </Link>
                                );
                              }
                              
                              return (
                                <button
                                  key={subItem.id}
                                  type="button"
                                  onClick={() => {
                                    if (subItem.marketplaceValue) {
                                      form.setValue('marketplace', subItem.marketplaceValue);
                                      
                                      // Special handling for government services
                                      if (section.id === 'government' && subItem.id === 'dr-congo') {
                                        setActiveSection('government');
                                        form.setValue('offeringType', 'service');
                                        form.setValue('category', 'gov-document');
                                      }
                                    } else if (subItem.onClick) {
                                      subItem.onClick();
                                    }
                                  }}
                                  data-testid={`${section.id}-${subItem.id}`}
                                  className={cn(
                                    "w-full block px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all text-left",
                                    isSelected
                                      ? "bg-black text-white shadow-sm"
                                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                  )}
                                >
                                  {subItem.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={section.href}
                        data-testid={`section-${section.id}`}
                        aria-current={section.isActive ? 'page' : undefined}
                        className={cn(
                          "w-full block px-5 py-4 rounded-lg text-base font-semibold tracking-wide transition-all text-left",
                          section.isActive
                            ? "bg-black text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {section.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Pre-filled Data Indicator */}
          {parsedPrefillData && parsedPrefillData.name && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Product Data Auto-Filled from RQST
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Product "{parsedPrefillData.name}" has been automatically filled. Review the details below and click Publish to add to your store.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Offering Type Selection - Conditional based on government service or lifestyle/services sections */}
          {isGovernmentService ? (
            <div className="mb-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t("What are you offering?")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-4 gap-4"
                      >
                        {GOVERNMENT_SERVICE_CATEGORIES.map((category) => (
                          <div key={category.value} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={category.value} 
                              id={category.value} 
                              className="border-gray-300 text-black data-[state=checked]:border-black data-[state=checked]:bg-black" 
                            />
                            <label htmlFor={category.value} className="text-sm font-medium cursor-pointer">
                              {t(category.label)}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ) : (activeSection === 'lifestyle' || activeSection === 'services') ? null : (
            <div className="mb-6">
              <FormField
                control={form.control}
                name="offeringType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>{t("What are you offering?")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="product" id="product" className="border-gray-300 text-black data-[state=checked]:border-black data-[state=checked]:bg-black" />
                          <label htmlFor="product" className="text-sm font-medium cursor-pointer">
                            {t("Product")}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="service" id="service" className="border-gray-300 text-black data-[state=checked]:border-black data-[state=checked]:bg-black" />
                          <label htmlFor="service" className="text-sm font-medium cursor-pointer">
                            {t("Service")}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="digital_product" id="digital_product" className="border-gray-300 text-black data-[state=checked]:border-black data-[state=checked]:bg-black" />
                          <label htmlFor="digital_product" className="text-sm font-medium cursor-pointer">
                            {t("Digital Product")}
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Unique Lifestyle Forms */}
          {activeSection === 'lifestyle' && selectedLifestyleType && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {selectedLifestyleType === 'food' && t("Food Ordering Details")}
                  {selectedLifestyleType === 'groceries' && t("Grocery Product Details")}
                  {selectedLifestyleType === 'reservation' && t("Reservation Details")}
                </CardTitle>
                <CardDescription>
                  {selectedLifestyleType === 'food' && t("Provide details about the food item or meal")}
                  {selectedLifestyleType === 'groceries' && t("Provide details about the grocery product")}
                  {selectedLifestyleType === 'reservation' && t("Provide details about the reservation service")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subcategory Selection */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => {
                    const categories = selectedLifestyleType === 'food' 
                      ? LIFESTYLE_FOOD_CATEGORIES 
                      : selectedLifestyleType === 'groceries'
                      ? LIFESTYLE_GROCERY_CATEGORIES
                      : LIFESTYLE_RESERVATION_CATEGORIES;
                    
                    return (
                      <FormItem>
                        <FormLabel>
                          {selectedLifestyleType === 'food' && t("Food Category")}
                          {selectedLifestyleType === 'groceries' && t("Grocery Category")}
                          {selectedLifestyleType === 'reservation' && t("Reservation Type")}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {t(cat.label)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Food Ordering Form */}
                {selectedLifestyleType === 'food' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryFields.cuisine_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Cuisine Type")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select cuisine")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['African', 'Asian', 'American', 'European', 'Mediterranean', 'Latin', 'Fusion', 'Other'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.meal_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Meal Type")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select meal type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Beverage'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.spice_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Spice Level")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select spice level")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Mild', 'Medium', 'Hot', 'Extra Hot'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.preparation_time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Preparation Time (mins)")}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder={t("e.g., 30")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.dietary_options"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Dietary Options")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., Vegetarian, Vegan, Halal, Gluten-Free")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Groceries Form */}
                {selectedLifestyleType === 'groceries' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryFields.brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Brand")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("Brand name")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Weight/Size")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 1kg, 500g, 2L")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.origin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Origin")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("Country/Region")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.organic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Organic")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Yes">{t("Yes")}</SelectItem>
                                <SelectItem value="No">{t("No")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.expiry_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Expiry Date")}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.storage_temp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Storage Temperature")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Refrigerated', 'Frozen', 'Room Temperature'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.allergens"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Allergens")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., Nuts, Dairy, Gluten, Soy")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Reservation Form */}
                {selectedLifestyleType === 'reservation' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryFields.restaurant_name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Venue/Business Name")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("Name of restaurant, hotel, or venue")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.cuisine_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Cuisine Type / Service Type")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['African', 'Asian', 'American', 'European', 'Mediterranean', 'Latin', 'Fusion', 'Hotel', 'Spa', 'Event Space', 'Other'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.seating_capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Capacity")}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder={t("e.g., 4 people")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.time_slot"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Available Time Slots")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 7:00 PM - 9:00 PM")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.location"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Location/Address")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("Full address or area")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Unique Services Forms */}
          {activeSection === 'services' && selectedServiceType && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {selectedServiceType === 'jobs' && t("Job Posting Details")}
                  {selectedServiceType === 'freelance' && t("Freelance Project Details")}
                </CardTitle>
                <CardDescription>
                  {selectedServiceType === 'jobs' && t("Provide details about the job opportunity")}
                  {selectedServiceType === 'freelance' && t("Provide details about the freelance project")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subcategory Selection */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => {
                    const categories = selectedServiceType === 'jobs' 
                      ? JOBS_CATEGORIES 
                      : FREELANCE_CATEGORIES;
                    
                    return (
                      <FormItem>
                        <FormLabel>
                          {selectedServiceType === 'jobs' && t("Job Type")}
                          {selectedServiceType === 'freelance' && t("Freelance Category")}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("Select category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {t(cat.label)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Jobs Form */}
                {selectedServiceType === 'jobs' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryFields.job_title"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Job Title")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., Senior Software Engineer")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.employment_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Employment Type")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.experience_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Experience Level")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select level")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Entry Level', 'Mid Level', 'Senior Level', 'Executive'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.salary_range"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Salary Range")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., $50,000 - $70,000 annually")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.job_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Job Location")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("City, State/Country or Remote")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.skills_required"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Required Skills")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., JavaScript, React, Node.js, Python")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.education_required"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Education Required")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select education")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['High School', 'Associate Degree', 'Bachelor Degree', 'Master Degree', 'PhD', 'Not Required'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.time_zone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Time Zone (if remote)")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., EST, PST, UTC+2")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Freelance Form */}
                {selectedServiceType === 'freelance' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryFields.project_title"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Project Title")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("Name of the project")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.project_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Project Duration")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., 2 weeks, 1 month, 3 months")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.budget_range"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Budget Range")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., $500 - $1000")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.experience_required"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Experience Required")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select level")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['Beginner', 'Intermediate', 'Expert', 'Any'].map((opt) => (
                                  <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Deadline")}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.tech_stack"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Tech Stack / Tools Required")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., React, Node.js, MongoDB, Figma, Adobe XD")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.deliverables"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("Expected Deliverables")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("e.g., Logo, Brand Kit, Website Mockup, Video Edit")} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryFields.portfolio_required"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Portfolio Required")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("Select")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Yes">{t("Yes")}</SelectItem>
                                <SelectItem value="No">{t("No")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Category Selection - Hidden for lifestyle/services sections as they use custom forms */}
          {!isGovernmentService && !(activeSection === 'lifestyle' && selectedLifestyleType) && !(activeSection === 'services' && selectedServiceType) && (
            <div className="mb-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => {
                  const offeringType = form.watch('offeringType');
                  let availableCategories;
                  
                  if (activeSection === 'lifestyle' && selectedLifestyleType) {
                    availableCategories = selectedLifestyleType === 'food' 
                      ? LIFESTYLE_FOOD_CATEGORIES 
                      : selectedLifestyleType === 'groceries'
                      ? LIFESTYLE_GROCERY_CATEGORIES
                      : LIFESTYLE_RESERVATION_CATEGORIES;
                  } else if (activeSection === 'services' && selectedServiceType) {
                    availableCategories = selectedServiceType === 'jobs' 
                      ? JOBS_CATEGORIES 
                      : FREELANCE_CATEGORIES;
                  } else {
                    availableCategories = offeringType === 'service' 
                      ? SERVICE_CATEGORIES 
                      : offeringType === 'digital_product'
                      ? DIGITAL_CATEGORIES
                      : PRODUCT_CATEGORIES;
                  }
                  
                  return (
                    <FormItem>
                      <FormLabel>{t("Product Category")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select category")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {availableCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {t(cat.label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          )}

          {/* Dynamic Category-Specific Fields - Hidden for lifestyle/services as they have custom forms */}
          {form.watch('category') && !(activeSection === 'lifestyle' && selectedLifestyleType) && !(activeSection === 'services' && selectedServiceType) && (() => {
            const offeringType = form.watch('offeringType');
            const selectedCategory = form.watch('category');
            let categories;
            
            if (isGovernmentService) {
              categories = GOVERNMENT_SERVICE_CATEGORIES;
            } else if (activeSection === 'lifestyle' && selectedLifestyleType) {
              categories = selectedLifestyleType === 'food' 
                ? LIFESTYLE_FOOD_CATEGORIES 
                : selectedLifestyleType === 'groceries'
                ? LIFESTYLE_GROCERY_CATEGORIES
                : LIFESTYLE_RESERVATION_CATEGORIES;
            } else if (activeSection === 'services' && selectedServiceType) {
              categories = selectedServiceType === 'jobs' 
                ? JOBS_CATEGORIES 
                : FREELANCE_CATEGORIES;
            } else {
              categories = offeringType === 'service' 
                ? SERVICE_CATEGORIES 
                : offeringType === 'digital_product'
                ? DIGITAL_CATEGORIES
                : PRODUCT_CATEGORIES;
            }
            
            const categoryConfig = categories.find(c => c.value === selectedCategory);
            const fieldsToRender = categoryConfig?.fields || [];

            if (fieldsToRender.length === 0) return null;

            return (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{t("Category-Specific Details")}</CardTitle>
                  <CardDescription>{t("Fill in the details specific to your category")}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldsToRender.map((fieldKey) => {
                    const fieldConfig = FIELD_CONFIGS[fieldKey];
                    if (!fieldConfig) return null;

                    const fieldName = `categoryFields.${fieldKey}` as any;

                    if (fieldKey === 'mileage') {
                      return (
                        <FormField
                          key={fieldKey}
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t(fieldConfig.label)}</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    type={fieldConfig.type}
                                    placeholder={fieldConfig.placeholder ? t(fieldConfig.placeholder) : ''}
                                    {...field}
                                    className="flex-1"
                                    data-testid="input-mileage"
                                  />
                                </FormControl>
                                <div className="flex items-center px-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 min-w-[60px] justify-center">
                                  <span className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-mileage-unit">
                                    {distanceUnit}
                                  </span>
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    }

                    if (fieldConfig.type === 'select') {
                      return (
                        <FormField
                          key={fieldKey}
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t(fieldConfig.label)}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("Select")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {fieldConfig.options?.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {t(opt)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    }

                    if (fieldConfig.type === 'date') {
                      return (
                        <FormField
                          key={fieldKey}
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t(fieldConfig.label)}</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    }

                    if (fieldKey === 'requirements') {
                      const documentType = form.watch('categoryFields.document_type');
                      const serviceType = form.watch('categoryFields.service_type');
                      const requirementKey = documentType || serviceType;
                      const predefinedRequirements = requirementKey ? DOCUMENT_REQUIREMENTS[requirementKey] : null;
                      
                      if (predefinedRequirements) {
                        return (
                          <FormField
                            key={fieldKey}
                            control={form.control}
                            name={fieldName}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>{t(fieldConfig.label)}</FormLabel>
                                <div className="space-y-2">
                                  {predefinedRequirements.map((requirement, index) => (
                                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                                      <span className="text-sm font-medium">{requirement}</span>
                                    </div>
                                  ))}
                                </div>
                                <FormControl>
                                  <Input type="hidden" {...field} value={predefinedRequirements.join(', ')} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      }
                    }

                    return (
                      <FormField
                        key={fieldKey}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t(fieldConfig.label)}</FormLabel>
                            <FormControl>
                              <Input
                                type={fieldConfig.type}
                                placeholder={fieldConfig.placeholder ? t(fieldConfig.placeholder) : ''}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            );
          })()}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Title Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Title")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("Short sleeve t-shirt")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>{t("Description")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("Product description...")} 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Marketplace selection is now handled via sidebar navigation */}
                  <FormField
                    control={form.control}
                    name="marketplace"
                    render={({ field }) => {
                      const displayInfo = getMarketplaceDisplayLabel();
                      return (
                        <FormItem className="mt-4">
                          <FormLabel>{t("Selected Marketplace")}</FormLabel>
                          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {displayInfo.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {displayInfo.description}
                            </p>
                          </div>
                          <FormDescription>
                            {t("Select marketplace from the sidebar navigation")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </CardContent>
              </Card>

              {/* Media Section */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Media")}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("Upload up to 12 images and 1 video for your product")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{t("Product Images")}</h3>
                      <span className="text-sm text-muted-foreground">
                        {uploadedImages.length}/12 {t("images")}
                      </span>
                    </div>
                    
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">{t("Upload Images")}</TabsTrigger>
                        <TabsTrigger value="url">{t("Image URLs")}</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upload" className="space-y-4">
                        {/* File Upload Area */}
                        <label 
                          htmlFor="image-upload" 
                          className="block border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <span className="mt-2 block text-sm font-medium text-gray-900">
                                {t("Upload images")}
                              </span>
                              <span className="mt-1 block text-sm text-gray-500">
                                {t("PNG, JPG, GIF up to 5MB each")}
                              </span>
                            </div>
                          </div>
                          <input
                            id="image-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadedImages.length >= 12}
                          />
                        </label>
                        
                        {/* Uploaded Images Grid */}
                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {uploadedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image.preview}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                  {index === 0 ? t("Main") : `${index + 1}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="url" className="space-y-4">
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Primary Image URL")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("https://example.com/image.jpg")} {...field} />
                              </FormControl>
                              <FormDescription>
                                {t("Provide a URL to your main product image")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Additional Image URLs */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">{t("Additional Image URLs")}</Label>
                          {imageUrls.map((url, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`${t("Image")} ${index + 2} URL`}
                                value={url}
                                onChange={(e) => updateImageUrl(index, e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeImageUrl(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {imageUrls.length < 11 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addImageUrl}
                              className="w-full"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {t("Add Image URL")}
                            </Button>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  {/* Video Upload Section */}
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{t("Product Video")}</h3>
                      <span className="text-sm text-muted-foreground">
                        {uploadedVideo ? "1/1" : "0/1"} {t("video")}
                      </span>
                    </div>
                    
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">{t("Upload Video")}</TabsTrigger>
                        <TabsTrigger value="url">{t("Video URL")}</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upload" className="space-y-4">
                        {!uploadedVideo ? (
                          <label 
                            htmlFor="video-upload" 
                            className="block border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
                          >
                            <div className="text-center">
                              <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="mt-4">
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                  {t("Upload video")}
                                </span>
                                <span className="mt-1 block text-sm text-gray-500">
                                  {t("MP4, MOV, AVI up to 50MB")}
                                </span>
                              </div>
                            </div>
                            <input
                              id="video-upload"
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleVideoUpload}
                            />
                          </label>
                        ) : (
                          <div className="relative">
                            <video
                              src={uploadedVideo.preview}
                              className="w-full h-48 object-cover rounded-lg border"
                              controls
                            />
                            <button
                              type="button"
                              onClick={removeVideo}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="url" className="space-y-4">
                        <FormField
                          control={form.control}
                          name="videoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Video URL")}</FormLabel>
                              <FormControl>
                                <Input placeholder={t("https://example.com/video.mp4")} {...field} />
                              </FormControl>
                              <FormDescription>
                                {t("Provide a URL to your product video")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Section */}
              <Card className={(activeSection === 'services' && selectedServiceType === 'jobs') ? 'opacity-50' : ''}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className={(activeSection === 'services' && selectedServiceType === 'jobs') ? 'text-gray-400' : ''}>
                    {t("Pricing")}
                  </CardTitle>
                  <CurrencySelector />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => {
                        const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                        return (
                          <FormItem>
                            <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                              {t("Price")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                disabled={isJobsForm}
                                className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="discountPrice"
                      render={({ field }) => {
                        const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                        return (
                          <FormItem>
                            <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                              {t("Compare-at price")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  if (!isJobsForm) {
                                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    field.onChange(value);
                                  }
                                }}
                                disabled={isJobsForm}
                                className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryFields.hourly_rate"
                      render={({ field }) => {
                        const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                        return (
                          <FormItem>
                            <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                              {t("Hourly Rate")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                disabled={isJobsForm}
                                className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="categoryFields.daily_rate"
                      render={({ field }) => {
                        const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                        return (
                          <FormItem>
                            <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                              {t("Daily Rate")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                disabled={isJobsForm}
                                className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="categoryFields.project_rate"
                      render={({ field }) => {
                        const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                        return (
                          <FormItem>
                            <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                              {t("Project Rate")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                disabled={isJobsForm}
                                className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="categoryFields.modifications_included"
                    render={({ field }) => {
                      const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                      return (
                        <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-4 ${isJobsForm ? 'opacity-50 bg-gray-50' : ''}`}>
                          <div className="space-y-0.5">
                            <FormLabel className={`text-base ${isJobsForm ? 'text-gray-400' : ''}`}>
                              {t("Modifications Included")}
                            </FormLabel>
                            <p className={`text-sm ${isJobsForm ? 'text-gray-400' : 'text-muted-foreground'}`}>
                              {t("Include modifications/revisions in the price")}
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === 'Yes'}
                              onCheckedChange={(checked) => {
                                if (!isJobsForm) {
                                  field.onChange(checked ? 'Yes' : 'No');
                                }
                              }}
                              disabled={isJobsForm}
                              className={isJobsForm ? 'cursor-not-allowed' : ''}
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />

                  {form.watch('categoryFields.modifications_included') === 'No' && (
                    <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
                      <h4 className="font-medium">{t("Modification Pricing")}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="categoryFields.modification_price_per_hour"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Per Hour")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="categoryFields.modification_price_per_revision"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("Per Revision")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="vatIncluded"
                    render={({ field }) => {
                      const isC2C = form.watch('marketplace') === 'c2c';
                      const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                      const isDisabled = isC2C || isJobsForm;
                      return (
                        <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-4 ${isDisabled ? 'opacity-50 bg-gray-50' : ''}`}>
                          <div className="space-y-0.5">
                            <FormLabel className={`text-base ${isDisabled ? 'text-gray-400' : ''}`}>
                              {t("VAT included in price")}
                            </FormLabel>
                            <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-muted-foreground'}`}>
                              {isC2C ? t("Not applicable for Friend to Friend marketplace") : t("Enable to include VAT/tax")}
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={isDisabled ? false : field.value}
                              onCheckedChange={isDisabled ? undefined : field.onChange}
                              disabled={isDisabled}
                              className={isDisabled ? 'cursor-not-allowed' : ''}
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                  
                  {form.watch('vatIncluded') && form.watch('marketplace') !== 'c2c' && (
                    <FormField
                      control={form.control}
                      name="vatRate"
                      render={({ field }) => {
                        const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                        return (
                          <FormItem>
                            <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                              {t("VAT Rate (%)")}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="20.00"
                                {...field}
                                onChange={(e) => {
                                  if (!isJobsForm) {
                                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    field.onChange(value);
                                  }
                                }}
                                disabled={isJobsForm}
                                className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}
                              />
                            </FormControl>
                            <p className={`text-sm ${isJobsForm ? 'text-gray-400' : 'text-muted-foreground'}`}>
                              {t("Standard UK VAT rate is 20%")}
                            </p>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}

                </CardContent>
              </Card>

              {/* Inventory Section - Only show for physical products */}
              {form.watch('offeringType') === 'product' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Inventory")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("SKU (Stock Keeping Unit)")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("SKU-001")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Barcode (ISBN, UPC, etc.)")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("1234567890123")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="trackQuantity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t("Track quantity")}</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {t("Deduct stock as items are sold")}
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('trackQuantity') && (
                    <>
                      <FormField
                        control={form.control}
                        name="inventory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("Quantity")}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="continueSellingWhenOutOfStock"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">{t("Continue selling when out of stock")}</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Shipping Section - Only show for physical products */}
              {form.watch('offeringType') === 'product' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Shipping")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requiresShipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t("This is a physical product")}</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('requiresShipping') && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("Weight")}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="any"
                                    min="0"
                                    max="10000000"
                                    placeholder="0" 
                                    {...field} 
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '') {
                                        field.onChange(undefined);
                                      } else {
                                        const numValue = parseFloat(value);
                                        // Allow up to 3 decimal places when user enters them
                                        const roundedValue = Math.round(numValue * 1000) / 1000;
                                        field.onChange(roundedValue);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="weightUnit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("Unit")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="lb">lb</SelectItem>
                                    <SelectItem value="oz">oz</SelectItem>
                                    <SelectItem value="g">g</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="dimensions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("Dimensions (L × W × H)")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("10 × 5 × 2 cm")} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        </div>
                        
                      <Button type="button" variant="outline" className="w-full" onClick={addCustomField}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("Add customs information")}
                      </Button>
                      
                      {/* Display custom fields */}
                      {customFields.length > 0 && (
                        <div className="space-y-3 mt-4">
                          {customFields.map((field) => (
                            <div key={field.id} className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                              <Input
                                placeholder="Field name"
                                value={field.name}
                                onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Field value"
                                  value={field.value}
                                  onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeCustomField(field.id)}
                                  className="px-3"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              )}
              
              {/* Variants - Only show for products */}
              {form.watch('offeringType') === 'product' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("Variants")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("Add options like size or color")}
                  </Button>
                </CardContent>
              </Card>
              )}

              {/* Service-specific fields */}
              {form.watch('offeringType') === 'service' && (
                <Card className={(activeSection === 'services' && selectedServiceType === 'jobs') ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle className={(activeSection === 'services' && selectedServiceType === 'jobs') ? 'text-gray-400' : ''}>
                      {t("Service Details")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="serviceDuration"
                        render={({ field }) => {
                          const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                          return (
                            <FormItem>
                              <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                                {t("Service Duration")}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t("e.g., 1 hour, 30 minutes")} 
                                  {...field} 
                                  disabled={isJobsForm}
                                  className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="serviceType"
                        render={({ field }) => {
                          const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                          return (
                            <FormItem>
                              <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                                {t("Service Type")}
                              </FormLabel>
                              <Select 
                                onValueChange={isJobsForm ? undefined : field.onChange} 
                                defaultValue={field.value}
                                disabled={isJobsForm}
                              >
                                <FormControl>
                                  <SelectTrigger className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}>
                                    <SelectValue placeholder={t("Select type")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="onetime">{t("One-time Service")}</SelectItem>
                                  <SelectItem value="recurring">{t("Recurring Service")}</SelectItem>
                                  <SelectItem value="subscription">{t("Subscription")}</SelectItem>
                                  <SelectItem value="consultation">{t("Consultation")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="serviceLocation"
                      render={({ field }) => {
                        const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                        return (
                          <FormItem>
                            <FormLabel className={isJobsForm ? 'text-gray-400' : ''}>
                              {t("Service Location")}
                            </FormLabel>
                            <Select 
                              onValueChange={isJobsForm ? undefined : field.onChange} 
                              defaultValue={field.value}
                              disabled={isJobsForm}
                            >
                              <FormControl>
                                <SelectTrigger className={isJobsForm ? 'cursor-not-allowed bg-gray-50' : ''}>
                                  <SelectValue placeholder={t("Select location type")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="online">{t("Online/Remote")}</SelectItem>
                                <SelectItem value="onsite">{t("On-site/Client Location")}</SelectItem>
                                <SelectItem value="office">{t("My Office/Studio")}</SelectItem>
                                <SelectItem value="flexible">{t("Flexible")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Product Organization */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("Product organization")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Vendor")}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t("Auto-filled from vendor account")} 
                            {...field}
                            disabled
                            className="bg-gray-50 cursor-not-allowed"
                          />
                        </FormControl>
                        <FormDescription>
                          {t("Automatically populated based on your vendor account and marketplace selection")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Product status")}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Status")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{t("Active")}</SelectItem>
                          <SelectItem value="draft">{t("Draft")}</SelectItem>
                          <SelectItem value="archived">{t("Archived")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>



            <Card>
              <CardHeader>
                <CardTitle>
                  {form.watch('offeringType') === 'service' ? t('Service badges') : t('Product badges')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isNew"
                  render={({ field }) => {
                    const isService = form.watch('offeringType') === 'service';
                    const isNotRelevant = isService || 
                      (activeSection === 'lifestyle' && (selectedLifestyleType === 'food' || selectedLifestyleType === 'reservation'));
                    
                    return (
                      <FormItem className={`flex flex-row items-center justify-between ${isNotRelevant ? 'opacity-50' : ''}`}>
                        <div className="space-y-0.5">
                          <FormLabel className={`text-sm font-normal ${isNotRelevant ? 'text-gray-400' : ''}`}>
                            {t('New Product')}
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={isNotRelevant ? undefined : field.onChange}
                            disabled={isNotRelevant}
                            className={isNotRelevant ? 'cursor-not-allowed' : ''}
                          />
                        </FormControl>
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="isOnSale"
                  render={({ field }) => {
                    const isJobsForm = activeSection === 'services' && selectedServiceType === 'jobs';
                    return (
                      <FormItem className={`flex flex-row items-center justify-between ${isJobsForm ? 'opacity-50' : ''}`}>
                        <div className="space-y-0.5">
                          <FormLabel className={`text-sm font-normal ${isJobsForm ? 'text-gray-400' : ''}`}>
                            {t('On Sale')}
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={isJobsForm ? undefined : field.onChange}
                            disabled={isJobsForm}
                            className={isJobsForm ? 'cursor-not-allowed' : ''}
                          />
                        </FormControl>
                      </FormItem>
                    );
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Code</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="productCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unique Product Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Generated automatically when published"
                          disabled
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            </div>
          </div>
          
          {/* Publish Button */}
          <div className="mt-8">
            <Button 
              type="submit" 
              disabled={createProductMutation.isPending} 
              className="w-full bg-black hover:bg-gray-800 text-white"
              onClick={(e) => {
                console.log('🔘 Publish button clicked!', e);
                console.log('📊 Form state:', form.formState);
                console.log('📝 Form values:', form.getValues());
                console.log('❌ Form errors:', form.formState.errors);
              }}
            >
              {createProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {createProductMutation.isPending ? t("Publishing...") : t("Publish")}
            </Button>
          </div>
          </form>
        </Form>
      
          {/* Vendor Creation Dialog */}
          <VendorCreationDialog
            open={showVendorDialog}
            onOpenChange={setShowVendorDialog}
            onSubmit={handleVendorSubmit}
            isLoading={createVendorMutation.isPending}
          />

          {/* Success Dialog */}
          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <DialogTitle className="text-2xl font-bold text-green-600 text-center">
                  SUCCESS!
                </DialogTitle>
                <DialogDescription className="text-center space-y-2">
                  <p className="text-lg font-medium">
                    Your product "{successData?.name || form.getValues('name')}" has been published!
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                    <p><strong>Product Code:</strong> {successData?.productCode || 'Generated'}</p>
                    <p><strong>Marketplace:</strong> {successData?.marketplace?.toUpperCase() || 'C2C'}</p>
                  </div>
                  <p className="text-gray-600">
                    Redirecting to product page...
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center">
                <Button 
                  onClick={handleSuccessConfirm}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  OK
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* End Main Content Area */}
      </div>
      {/* End Grid Layout */}
    </div>
  );
}
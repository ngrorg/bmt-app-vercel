import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Globe, Package, Truck, Calendar, User, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const taskFormSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  deliveryAddress: z.string().min(1, 'Delivery address is required').max(500),
  productName: z.string().optional(),
  supplier: z.string().min(1, 'Supplier is required').max(200),
  numberOfBags: z.coerce.number().min(0, 'Must be 0 or more').default(0),
  bagWeight: z.coerce.number().min(0.01, 'Bag weight must be greater than 0'),
  docketNumber: z.string().min(1, 'Docket number is required').max(100),
  vehicleType: z.enum(['truck', 'tank']),
  haulierTanker: z.string().min(1, 'Haulier/Tanker is required').max(200),
  plannedDecantDate: z.date({ required_error: 'Planned decant date is required' }),
  plannedDeliveryDate: z.date({ required_error: 'Planned delivery date is required' }),
  assignedDriverId: z.string().optional(),
  assignedDriverName: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface Driver {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

// Bag weight options
const bagWeights = [500, 1000, 1500, 2000];

export function CreateTaskForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [supplierSearchValue, setSupplierSearchValue] = useState('');
  const [supplierOpen, setSupplierOpen] = useState(false);

  // Fetch drivers from database
  useEffect(() => {
    async function fetchDrivers() {
      try {
        const { data: driverRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'driver');

        if (rolesError) throw rolesError;

        if (driverRoles && driverRoles.length > 0) {
          const driverIds = driverRoles.map(r => r.user_id);
          
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', driverIds);

          if (profilesError) throw profilesError;

          const driverList = profiles?.map(p => ({
            id: p.user_id,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unnamed Driver',
          })) || [];

          setDrivers(driverList);
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      } finally {
        setIsLoadingDrivers(false);
      }
    }

    fetchDrivers();
  }, []);

  // Fetch suppliers from database
  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('id, name')
          .order('name');

        if (error) throw error;

        setSuppliers(data || []);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setIsLoadingSuppliers(false);
      }
    }

    fetchSuppliers();
  }, []);

  // Add new supplier to database
  const addNewSupplier = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Duplicate - find existing
          const existing = suppliers.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
          return existing || null;
        }
        throw error;
      }

      setSuppliers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    } catch (error) {
      console.error('Error adding supplier:', error);
      return null;
    }
  };

  const handleSupplierSelect = async (value: string, field: any) => {
    const existingSupplier = suppliers.find(s => s.name.toLowerCase() === value.toLowerCase());
    
    if (existingSupplier) {
      field.onChange(existingSupplier.name);
    } else if (value.trim()) {
      // Add new supplier
      const newSupplier = await addNewSupplier(value);
      if (newSupplier) {
        field.onChange(newSupplier.name);
        toast({
          title: 'Supplier Added',
          description: `"${newSupplier.name}" has been added to suppliers.`,
        });
      }
    }
    setSupplierOpen(false);
    setSupplierSearchValue('');
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      customerName: '',
      deliveryAddress: '',
      productName: '',
      supplier: '',
      numberOfBags: 0,
      bagWeight: 2000,
      docketNumber: '',
      vehicleType: 'truck',
      haulierTanker: '',
      assignedDriverId: '',
      assignedDriverName: '',
    },
  });

  const numberOfBags = form.watch('numberOfBags');
  const bagWeight = form.watch('bagWeight');
  const totalWeight = (numberOfBags || 0) * (bagWeight || 0);
  const totalWeightTonnes = totalWeight / 1000;

  const onSubmit = async (data: TaskFormValues, addAnother: boolean = false) => {
    setIsSubmitting(true);
    
    try {
      const { data: newTask, error } = await supabase.from('tasks').insert({
        customer_name: data.customerName,
        delivery_address: data.deliveryAddress,
        product_name: data.productName || null,
        supplier: data.supplier,
        number_of_bags: data.numberOfBags,
        bag_weight: data.bagWeight,
        docket_number: data.docketNumber,
        vehicle_type: data.vehicleType,
        haulier_tanker: data.haulierTanker,
        planned_decant_date: format(data.plannedDecantDate, 'yyyy-MM-dd'),
        planned_delivery_date: format(data.plannedDeliveryDate, 'yyyy-MM-dd'),
        assigned_driver_id: data.assignedDriverId || null,
        assigned_driver_name: data.assignedDriverName || null,
        status: 'new',
      }).select().single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Task Created',
        description: 'The delivery task has been created successfully. Add attachments below.',
      });

      if (addAnother) {
        form.reset();
      } else {
        navigate(`/tasks/${newTask.id}`);
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    form.setValue('assignedDriverId', driverId);
    form.setValue('assignedDriverName', driver?.name || '');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-8">
        {/* Customer Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Customer Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name of BMT Customer*</FormLabel>
                    <FormControl>
                      <Input placeholder="Type customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Delivery Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="Type delivery address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Product Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., High Alumina Cement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Supplier*</FormLabel>
                    <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={supplierOpen}
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value || (isLoadingSuppliers ? "Loading..." : "Select or type supplier")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search or add supplier..." 
                            value={supplierSearchValue}
                            onValueChange={setSupplierSearchValue}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {supplierSearchValue.trim() ? (
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start"
                                  onClick={() => handleSupplierSelect(supplierSearchValue, field)}
                                >
                                  Add "{supplierSearchValue.trim()}"
                                </Button>
                              ) : (
                                "No suppliers found."
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {suppliers
                                .filter(s => s.name.toLowerCase().includes(supplierSearchValue.toLowerCase()))
                                .map((supplier) => (
                                  <CommandItem
                                    key={supplier.id}
                                    value={supplier.name}
                                    onSelect={() => handleSupplierSelect(supplier.name, field)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === supplier.name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {supplier.name}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="numberOfBags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Bulk Bags</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bagWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bag Weight (kg/bag)*</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select weight" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bagWeights.map((weight) => (
                          <SelectItem key={weight} value={String(weight)}>
                            {weight}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Total Load Weight Display */}
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Total Load Weight: <span className="text-primary font-semibold">{totalWeight} kg</span> ({totalWeightTonnes.toFixed(2)} tonnes)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Details */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Delivery Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="docketNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BMT Delivery Docket Number*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 4500640907" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="tank">Tank</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="haulierTanker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designated Haulier/Tanker*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 45511" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Schedule</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="plannedDecantDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Planned Date for Decant*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'MM/dd/yyyy')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="plannedDeliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Planned Date for Delivery*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'MM/dd/yyyy')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Driver Assignment */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Driver Assignment</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="assignedDriverId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name of Driver for Delivery</FormLabel>
                    <Select onValueChange={handleDriverChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingDrivers ? "Loading drivers..." : "Select driver"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingDrivers ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : drivers.length === 0 ? (
                          <div className="py-2 px-2 text-sm text-muted-foreground">
                            No drivers available
                          </div>
                        ) : (
                          drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tasks')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit((data) => onSubmit(data, true))}
              disabled={isSubmitting}
            >
              Save and Add Another
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Task'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

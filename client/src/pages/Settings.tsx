import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { stackClientApp } from '@/stack';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

export default function Settings() {
  const user = stackClientApp.useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  if (!user) {
    return null;
  }

  const userId = user.id;

  const { data: dbUser, isLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
  });

  useEffect(() => {
    // Initialize from Stack Auth user object and clientMetadata
    const metadata = user.clientMetadata as { firstName?: string; lastName?: string } | undefined;
    setFirstName(metadata?.firstName || '');
    setLastName(metadata?.lastName || '');
    setEmail(user.primaryEmail || '');
    setUsername(dbUser?.username || '');
  }, [user, dbUser]);

  const updateMutation = useMutation({
    mutationFn: async (updates: { firstName?: string; lastName?: string; username?: string }) => {
      // Update Stack Auth user with name in metadata and displayName
      await user.update({
        displayName: updates.firstName && updates.lastName 
          ? `${updates.firstName} ${updates.lastName}` 
          : user.displayName || undefined,
        clientMetadata: {
          firstName: updates.firstName || '',
          lastName: updates.lastName || '',
        }
      });

      // Update username in local database (Stack Auth doesn't support username)
      if (updates.username) {
        const response = await apiRequest('PATCH', `/api/users/${userId}`, {
          username: updates.username
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      username: username || undefined,
    });
  };

  const handleSignOut = () => {
    stackClientApp.redirectToSignOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/profile')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Settings & Privacy</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information and username</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                data-testid="input-username"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is how you'll be identified throughout the app
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="bg-muted"
                data-testid="input-email"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email is managed by your authentication provider and cannot be changed here
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full"
              data-testid="button-save-settings"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
              data-testid="button-sign-out-settings"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

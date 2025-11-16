import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Loader2, Search, Users, Check } from './icons';
import { useCartTranslations } from '@/locales/cartStrings';

interface GiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: any[];
  total: number;
  shippingCost: number;
  formatPrice: (price: number) => string;
  selectedRecipient: any;
  onSelectRecipient: (recipient: any) => void;
  giftMessage: string;
  onMessageChange: (message: string) => void;
  recipientSearch: string;
  onSearchChange: (search: string) => void;
  filteredUsers: any[];
  usersLoading: boolean;
  onSendGift: () => void;
  isSending: boolean;
  onCancel: () => void;
}

export default memo(function GiftDialog({
  open,
  onOpenChange,
  cartItems,
  total,
  shippingCost,
  formatPrice,
  selectedRecipient,
  onSelectRecipient,
  giftMessage,
  onMessageChange,
  recipientSearch,
  onSearchChange,
  filteredUsers,
  usersLoading,
  onSendGift,
  isSending,
  onCancel
}: GiftDialogProps) {
  const ts = useCartTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            {ts.sendGift}
          </DialogTitle>
          <DialogDescription>{ts.chooseRecipient}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Gift Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">{ts.giftSummary}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{ts.items}:</span>
                <span>{cartItems.length} {cartItems.length === 1 ? ts.itemSingular : ts.itemsPlural}</span>
              </div>
              <div className="flex justify-between">
                <span>{ts.totalValue}:</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>{ts.shippingCost}:</span>
                <span className="font-medium">
                  {shippingCost === 0 ? ts.free : formatPrice(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between font-medium text-base pt-2 border-t">
                <span>{ts.giftTotal}:</span>
                <span>{formatPrice(total + shippingCost)}</span>
              </div>
            </div>
          </div>

          {/* Recipient Selection */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{ts.selectRecipient}</h4>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={ts.searchUsers}
                value={recipientSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
                data-testid="input-search-recipient"
              />
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  {recipientSearch ? ts.noUsersFound : ts.noUsersAvailable}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRecipient?.id === user.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => onSelectRecipient(user)}
                      data-testid={`recipient-${user.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || user.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {user.name || user.username}
                          </div>
                          {user.name && user.username && (
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          )}
                        </div>
                        {selectedRecipient?.id === user.id && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gift Message */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{ts.personalMessage}</h4>
            <Input
              type="text"
              placeholder={ts.addMessage}
              value={giftMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              className="w-full"
              data-testid="input-gift-message"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel-gift"
            >
              {ts.cancel}
            </Button>
            <Button
              onClick={onSendGift}
              disabled={!selectedRecipient || isSending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-send-gift"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ts.sendingGift}
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  {ts.sendGiftButton}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

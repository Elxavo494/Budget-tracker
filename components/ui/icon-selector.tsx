'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Upload, Image, Check, Search, X, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ui/image-upload';
import { presetIcons, getLogoUrl } from '@/lib/preset-icons';

interface RecentIcon {
  id: string;
  type: 'custom' | 'preset';
  iconUrl: string;
  name: string;
  presetIconId?: string;
  lastUsed: number;
}

interface IconSelectorProps {
  iconUrl?: string;
  iconType?: 'custom' | 'preset';
  presetIconId?: string;
  onIconChange: (iconData: {
    iconUrl?: string;
    iconType?: 'custom' | 'preset';
    presetIconId?: string;
  }) => void;
  onFileSelect?: (file: File | undefined) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const RECENT_ICONS_KEY = 'recentlyUsedIcons';
const MAX_RECENT_ICONS = 8;

export const IconSelector: React.FC<IconSelectorProps> = ({
  iconUrl,
  iconType = 'custom',
  presetIconId,
  onIconChange,
  onFileSelect,
  label = 'Icon',
  disabled = false,
  className
}) => {
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [tempCustomIcon, setTempCustomIcon] = useState<string>('');
  const [tempCustomFile, setTempCustomFile] = useState<File | undefined>();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [recentIcons, setRecentIcons] = useState<RecentIcon[]>([]);

  // Load recent icons from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_ICONS_KEY);
      if (saved) {
        const parsed: RecentIcon[] = JSON.parse(saved);
        // Sort by lastUsed descending and limit to MAX_RECENT_ICONS
        const sorted = parsed
          .sort((a, b) => b.lastUsed - a.lastUsed)
          .slice(0, MAX_RECENT_ICONS);
        setRecentIcons(sorted);
      }
    } catch (error) {
      console.warn('Failed to load recent icons from localStorage:', error);
    }
  }, []);

  // Save icon to recent list
  const addToRecentIcons = (iconData: {
    iconUrl?: string;
    iconType?: 'custom' | 'preset';
    presetIconId?: string;
  }) => {
    if (!iconData.iconUrl) return;

    const newRecentIcon: RecentIcon = {
      id: iconData.presetIconId || `custom-${Date.now()}`,
      type: iconData.iconType || 'custom',
      iconUrl: iconData.iconUrl,
      name: iconData.iconType === 'preset' && iconData.presetIconId 
        ? presetIcons.find(icon => icon.id === iconData.presetIconId)?.name || 'Unknown'
        : 'Custom Icon',
      presetIconId: iconData.presetIconId,
      lastUsed: Date.now()
    };

    try {
      const updated = [newRecentIcon, ...recentIcons.filter(icon => icon.id !== newRecentIcon.id)]
        .slice(0, MAX_RECENT_ICONS);
      
      setRecentIcons(updated);
      localStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent icons to localStorage:', error);
    }
  };

  // Group icons by category with search filtering
  const getGroupedIcons = () => {
    // Filter icons based on search term
    const filteredIcons = searchTerm 
      ? presetIcons.filter(icon => 
          icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          icon.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : presetIcons;

    const grouped = filteredIcons.reduce((acc, icon) => {
      if (!acc[icon.category]) {
        acc[icon.category] = [];
      }
      acc[icon.category].push(icon);
      return acc;
    }, {} as Record<string, typeof presetIcons>);

    return grouped;
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handlePresetSelect = (iconId: string) => {
    const icon = presetIcons.find(i => i.id === iconId);
    if (icon) {
      const iconData = {
        iconUrl: getLogoUrl(icon.domain),
        iconType: 'preset' as const,
        presetIconId: iconId
      };
      onIconChange(iconData);
      addToRecentIcons(iconData);
      setPresetDialogOpen(false);
      setSearchTerm(''); // Reset search when closing
    }
  };

  const handleRecentIconSelect = (recentIcon: RecentIcon) => {
    const iconData = {
      iconUrl: recentIcon.iconUrl,
      iconType: recentIcon.type,
      presetIconId: recentIcon.presetIconId
    };
    onIconChange(iconData);
    addToRecentIcons(iconData);
    setPresetDialogOpen(false);
    setSearchTerm(''); // Reset search when closing
  };

  const handleCustomIconSave = () => {
    const iconData = {
      iconUrl: tempCustomIcon,
      iconType: 'custom' as const,
      presetIconId: undefined
    };
    onIconChange(iconData);
    addToRecentIcons(iconData);
    if (tempCustomFile) {
      onFileSelect?.(tempCustomFile);
    }
    setCustomDialogOpen(false);
  };

  const handleCustomIconCancel = () => {
    setTempCustomIcon('');
    setTempCustomFile(undefined);
    setCustomDialogOpen(false);
  };

  const getCurrentIcon = () => {
    if (iconType === 'preset' && presetIconId) {
      return presetIcons.find(icon => icon.id === presetIconId);
    }
    return null;
  };

  const currentIcon = getCurrentIcon();
  const groupedIcons = getGroupedIcons();

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      
      <div className="flex gap-2">
        {/* Preset Icons Dialog */}
        <div className="flex-1">
          <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                disabled={disabled}
              >
                <div className="flex items-center gap-2">
                  {currentIcon && (
                    <img 
                      src={getLogoUrl(currentIcon.domain)} 
                      alt={currentIcon.name}
                      className="w-5 h-5 object-contain rounded"
                    />
                  )}
                  <span className="truncate">
                    {currentIcon ? currentIcon.name : "Choose brand icon..."}
                  </span>
                </div>
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md h-[80vh] flex flex-col p-0">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle>Choose Brand Icon</DialogTitle>
              </DialogHeader>
              
              {/* Search Input */}
              <div className="px-6 py-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 text-base"
                  />
                </div>
              </div>

              {/* Recently Used Icons */}
              {!searchTerm && recentIcons.length > 0 && (
                <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recently Used</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {recentIcons.map((recentIcon) => (
                      <button
                        key={recentIcon.id}
                        onClick={() => handleRecentIconSelect(recentIcon)}
                        className="relative flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 touch-manipulation transition-colors"
                      >
                        <div className="w-8 h-8 flex items-center justify-center rounded border bg-white dark:bg-gray-700">
                          <img 
                            src={recentIcon.iconUrl} 
                            alt={recentIcon.name}
                            className="w-6 h-6 object-contain rounded"
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">
                          {recentIcon.name.length > 8 ? `${recentIcon.name.slice(0, 8)}...` : recentIcon.name}
                        </span>
                        {(
                          (recentIcon.type === 'preset' && presetIconId === recentIcon.presetIconId) ||
                          (recentIcon.type === 'custom' && iconType === 'custom' && iconUrl === recentIcon.iconUrl)
                        ) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto px-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                {Object.keys(groupedIcons).length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No brands found matching &ldquo;{searchTerm}&rdquo;
                  </div>
                ) : (
                  <div className="space-y-1 py-2">
                    {Object.entries(groupedIcons).map(([category, icons]) => {
                      const isCollapsed = collapsedCategories.has(category);
                      return (
                        <div key={category} className="mb-2">
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg touch-manipulation transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{category} ({icons.length})</span>
                          </button>

                          {/* Category Items */}
                          {!isCollapsed && (
                            <div className="mt-1 space-y-1">
                              {icons.map((icon) => (
                                <button
                                  key={icon.id}
                                  onClick={() => handlePresetSelect(icon.id)}
                                  className="w-full flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 rounded-lg touch-manipulation transition-colors"
                                >
                                  <img 
                                    src={getLogoUrl(icon.domain)} 
                                    alt={icon.name}
                                    className="w-8 h-8 object-contain rounded flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="font-medium truncate text-sm">{icon.name}</div>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4 flex-shrink-0 text-green-600",
                                      presetIconId === icon.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Custom Icon Button */}
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={disabled}
              className={cn(
                "shrink-0",
                iconType === 'custom' && iconUrl && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              )}
              title="Upload custom icon"
            >
              {iconType === 'custom' && iconUrl ? (
                <img 
                  src={iconUrl} 
                  alt="Custom icon"
                  className="w-5 h-5 object-cover rounded"
                />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Custom Icon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ImageUpload
                value={tempCustomIcon}
                onChange={(imageUrl) => setTempCustomIcon(imageUrl || '')}
                onFileSelect={setTempCustomFile}
                label=""
                placeholder="Upload a custom icon (will be resized to 124x124px)"
                disabled={disabled}
              />
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2">
              <Button 
                variant="outline" 
                onClick={handleCustomIconCancel}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCustomIconSave}
                disabled={!tempCustomIcon && !tempCustomFile}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm font-semibold"
              >
                Save Icon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Selection Display */}
      {(currentIcon || (iconType === 'custom' && iconUrl)) && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center bg-white dark:bg-gray-700">
            {currentIcon ? (
              <img 
                src={getLogoUrl(currentIcon.domain)} 
                alt={currentIcon.name}
                className="w-6 h-6 object-contain"
              />
            ) : iconUrl ? (
              <img 
                src={iconUrl} 
                alt="Custom icon"
                className="w-6 h-6 object-cover rounded"
              />
            ) : (
              <Image className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">
              {currentIcon ? currentIcon.name : 'Custom Icon'}
            </div>
            {currentIcon && (
              <Badge variant="secondary" className="text-xs">
                {currentIcon.category}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onIconChange({ iconUrl: undefined, iconType: undefined, presetIconId: undefined })}
            className="h-auto p-1"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
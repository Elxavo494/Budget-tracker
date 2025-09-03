'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Upload, Image, Check, ChevronsUpDown, X, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUpload } from '@/components/ui/image-upload';
import { presetIcons, getLogoUrl } from '@/lib/preset-icons';

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
  const [open, setOpen] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [tempCustomIcon, setTempCustomIcon] = useState<string>('');
  const [tempCustomFile, setTempCustomFile] = useState<File | undefined>();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

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
      onIconChange({
        iconUrl: getLogoUrl(icon.domain),
        iconType: 'preset',
        presetIconId: iconId
      });
      setOpen(false);
    }
  };

  const handleCustomIconSave = () => {
    onIconChange({
      iconUrl: tempCustomIcon,
      iconType: 'custom',
      presetIconId: undefined
    });
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
        {/* Preset Icons Searchable Dropdown */}
        <div className="flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
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
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <div className="rounded-lg border shadow-md">
                {/* Search Input */}
                <div className="p-3 border-b">
                  <Input
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Scrollable List */}
                <div className="max-h-[300px] overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {Object.keys(groupedIcons).length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No brands found.
                    </div>
                  ) : (
                    Object.entries(groupedIcons).map(([category, icons]) => {
                      const isCollapsed = collapsedCategories.has(category);
                      return (
                        <div key={category}>
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-b"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                            {category} ({icons.length})
                          </button>

                          {/* Category Items */}
                          {!isCollapsed && (
                            <div>
                              {icons.map((icon) => (
                                <button
                                  key={icon.id}
                                  onClick={() => handlePresetSelect(icon.id)}
                                  className="w-full flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700"
                                >
                                  <img 
                                    src={getLogoUrl(icon.domain)} 
                                    alt={icon.name}
                                    className="w-6 h-6 object-contain rounded flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0 text-left">
                                    <div className="font-medium truncate">{icon.name}</div>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4 flex-shrink-0",
                                      presetIconId === icon.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
          <DialogContent className="sm:max-w-md">
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
            <DialogFooter>
              <Button variant="outline" onClick={handleCustomIconCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleCustomIconSave}
                disabled={!tempCustomIcon && !tempCustomFile}
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